-- 官网漏斗事件底稿 —— 2026-08-04
--
-- 为什么要这张表:
--   前 5 枪(浏览页面/查看内容/加入购物车/潜在客户/发起结账)全是客人在页面上点点点,
--   直接从他的浏览器飞给 Meta,我们服务器全程不知情 —— Meta 说收到多少就是多少,
--   对不了账;像素被拦截器挡掉、或者哪天埋点被改坏,我们这边一点动静都没有。
--   老板要"每一枪我们自己也留一份底稿",这张表就是那份底稿。
--
-- 只存对账要用的,不存任何能认出人的东西:
--   没有手机号、没有姓名、没有邮箱、没有 IP、没有完整地址。
--   session_id 是浏览器自己生成的一串随机字符,只用来把同一个人的漏斗串起来
--   (看"进来 100 个,走到填手机号剩几个"),关掉标签页就换一个,认不到具体是谁。

create table if not exists public.website_funnel_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  session_id text not null default '',
  value numeric not null default 0,
  currency text not null default 'PHP',
  content_name text not null default '',
  content_ids text[] not null default '{}',
  page_path text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_funnel_events_time on public.website_funnel_events (created_at desc);
create index if not exists idx_funnel_events_name_time on public.website_funnel_events (event_name, created_at desc);
create index if not exists idx_funnel_events_session on public.website_funnel_events (session_id, created_at);

alter table public.website_funnel_events enable row level security;

-- ⚠ 只准写,不准读。
-- 这张表是官网(拿 anon key)写的,而 anon key 是公开的、藏不住。
-- 所以策略给死:anon 只能 insert,select/update/delete 一律没有 —— 就算 key 泄露,
-- 别人最多往里灌垃圾,读不走一条数据。后台要看数据走 service_role。
drop policy if exists website_funnel_events_insert_anon on public.website_funnel_events;
create policy website_funnel_events_insert_anon
  on public.website_funnel_events for insert to anon with check (true);

revoke all on table public.website_funnel_events from public, authenticated;
grant insert on table public.website_funnel_events to anon;
grant select, insert on table public.website_funnel_events to service_role;

-- 跑完自查(应该是 0 行,还没开始收):
-- select event_name, count(*) from public.website_funnel_events group by 1;
