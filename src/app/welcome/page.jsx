import WelcomeGift from '../../components/WelcomeGift';

// 广告落地页(2026-07-29 老板拍板)。
// 客人点广告 → 落这一页 → 输手机号 → 拆开 ₱150 → 24 小时倒计时 → 直推技师墙。
// 设计铁律(老板定的):
//  · 只有一屏、只有一个输入框、只有一个按钮 —— 跳出 Facebook 本来就掉人,别再加步骤
//  · 只要手机号不要邮箱 —— 我们发不了邮件,但 WhatsApp 能追;而且菲律宾人背得出手机号
//  · 文案不写 "win / lucky / 抽奖" —— 这是优惠券不是博彩,也避开 Meta 的误判
export const metadata = {
  title: 'Your welcome gift | EasyGo Spa',
  description: 'First booking? Open your welcome gift. No transport fee, no tips, cash when your therapist arrives.',
  // 这是广告落地页,不给搜索引擎收录(免得优惠被当成常态价挂在搜索结果里)
  robots: { index: false, follow: false }
};

export default function WelcomePage() {
  return <WelcomeGift />;
}
