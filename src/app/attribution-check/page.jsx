'use client';

import { useEffect, useState } from 'react';
import { readAdAttribution, captureAdAttribution } from '@/lib/adAttribution.mjs';

// 归因自检页(2026-07-28):老板下单后订单没广告徽章,要一秒分清是
// "这台浏览器压根没带广告标记" 还是 "带了但后端吃掉了"。
// 不是给客人看的页面,只有知道网址的人能进。
export default function AttributionCheckPage() {
  const [mark, setMark] = useState(undefined);
  const [refreshed, setRefreshed] = useState(0);

  useEffect(() => {
    try { captureAdAttribution(); } catch { /* ignore */ }
    setMark(readAdAttribution());
  }, [refreshed]);

  const isAd = mark && mark.channel === 'ad' && (mark.fbclid || mark.utmSource);
  const box = { maxWidth: 640, margin: '40px auto', padding: 24, fontFamily: 'ui-sans-serif, system-ui, "Microsoft YaHei", sans-serif', lineHeight: 1.8 };
  const card = { padding: 18, borderRadius: 14, marginTop: 16, fontSize: 15 };

  return (
    <main style={box}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>归因自检</h1>
      <p style={{ color: '#667', fontSize: 14 }}>看这台浏览器现在带不带广告标记。带了,下单就会记进订单;没带,下的单永远不会有广告徽章。</p>

      {mark === undefined ? <p>读取中…</p> : isAd ? (
        <div style={{ ...card, background: '#e4f5ec', color: '#14603c' }}>
          <p style={{ fontWeight: 700, fontSize: 17 }}>✅ 带着广告标记</p>
          <p style={{ marginTop: 8 }}>现在用这台浏览器下单,那一单会被记成「广告带来的」。</p>
          <pre style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 10, fontSize: 12.5, overflowX: 'auto' }}>{JSON.stringify(mark, null, 2)}</pre>
        </div>
      ) : mark ? (
        <div style={{ ...card, background: '#fcf0dc', color: '#7a4a10' }}>
          <p style={{ fontWeight: 700, fontSize: 17 }}>⚠ 只有"自然流量"标记,没有广告标记</p>
          <p style={{ marginTop: 8 }}>这台浏览器没走过广告链接。现在下单会被记成「自己找来的」,不会有广告徽章——这是对的,不是 bug。</p>
          <pre style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 10, fontSize: 12.5, overflowX: 'auto' }}>{JSON.stringify(mark, null, 2)}</pre>
        </div>
      ) : (
        <div style={{ ...card, background: '#fdeae8', color: '#8a2b22' }}>
          <p style={{ fontWeight: 700, fontSize: 17 }}>❌ 什么标记都没有</p>
          <p style={{ marginTop: 8 }}>可能是隐私模式,或浏览器禁了本地存储。</p>
        </div>
      )}

      <div style={{ marginTop: 24, padding: 16, borderRadius: 14, background: '#f2f4f8', fontSize: 14 }}>
        <p style={{ fontWeight: 700 }}>要让它变成"带广告标记",点这个链接一次就够:</p>
        <p style={{ marginTop: 8, wordBreak: 'break-all' }}>
          <a href="/?fbclid=MANUAL_CHECK&utm_source=meta&utm_medium=paid&utm_campaign=manual_check" style={{ color: '#2f6fd8' }}>
            /?fbclid=MANUAL_CHECK&amp;utm_source=meta&amp;utm_medium=paid&amp;utm_campaign=manual_check
          </a>
        </p>
        <p style={{ marginTop: 8, color: '#667' }}>点完回到这一页刷新,上面就会变绿。标记存 30 天,期间在这台浏览器下的单都算广告带来的。</p>
        <button onClick={() => setRefreshed(n => n + 1)} style={{ marginTop: 12, padding: '8px 18px', borderRadius: 999, border: 'none', background: '#1d2231', color: '#fff', cursor: 'pointer' }} type="button">重新检查</button>
      </div>
    </main>
  );
}
