import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeFunnelEvent } from '@/lib/funnelEvent.mjs';

// 官网漏斗底稿收件口 —— 2026-08-04
// 前 5 枪本来只有客人浏览器发给 Meta,我们手上没底稿、对不了账。这个口子把每一枪
// 也抄一份进我们自己的库。
//
// 三条规矩:
//   ① 永远不影响客人下单。这个口子挂了、库挂了、参数不对,一律安静地回 ok,
//      绝不让一个埋点把下单流程带崩。
//   ② 只认白名单里的事件名。这是公开接口,不设防就是给人当垃圾桶。
//   ③ 一个字的个人信息都不收(见 sql/001 的注释)。手机号姓名邮箱一律不接,
//      接了也不存。

export const runtime = 'nodejs';

const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
// 用 anon key:这张表的 RLS 只给 anon 开了 insert,读不了。
// 官网本来就没有 service key,也不该有。
const anonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// 一个浏览器会话每分钟最多写这么多条。防的是脚本狂刷,不是防正常客人
// (正常人一分钟点不出 40 个漏斗动作)。进程内计数,够用了——真被大规模刷,
// RLS 也保证了对方只能灌垃圾读不走东西。
const RATE_LIMIT = 40;
const RATE_WINDOW_MS = 60 * 1000;
const hits = new Map();

function rateLimited(key) {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now - rec.at > RATE_WINDOW_MS) {
    hits.set(key, { at: now, n: 1 });
    if (hits.size > 5000) hits.clear();   // 别让这张表把内存吃了
    return false;
  }
  rec.n += 1;
  return rec.n > RATE_LIMIT;
}

export async function POST(request) {
  // 不管出什么事都回 200 ok:这是旁路埋点,客人那边不该看到任何错误
  try {
    if (!url || !anonKey) return NextResponse.json({ ok: true, skipped: 'not_configured' });
    const body = await request.json().catch(() => null);
    const event = normalizeFunnelEvent(body);
    if (!event) return NextResponse.json({ ok: true, skipped: 'ignored' });
    if (rateLimited(event.session_id || 'anon')) return NextResponse.json({ ok: true, skipped: 'rate_limited' });

    const sb = createClient(url, anonKey, { auth: { persistSession: false } });
    await sb.from('website_funnel_events').insert(event);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true, skipped: 'error' });
  }
}

export function GET() {
  // 只收不发。要看数据走后台(service_role),不从这儿读。
  return NextResponse.json({ ok: false, error: 'write only' }, { status: 405 });
}
// ⚠ 路由文件只准导出 Next.js 认识的那几个(GET/POST/runtime/...)。
// 多导出一个常量就构建失败(2026-08-04 踩过:导了个 runtimeEvents 给验收脚本用,
// next build 直接报类型错)。要共用常量就从 @/lib/funnelEvent.mjs 里 import。
