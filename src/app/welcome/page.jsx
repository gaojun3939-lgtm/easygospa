import WelcomeGift from '../../components/WelcomeGift';

// 广告落地页(2026-08-01 老板拍板改版:先亮货、后设卡)。
// 客人点广告 → 第一屏先看到真实技师(零门槛,不弹定位不要输入)
// → 动了心 → 第二屏输手机号拆 ₱150 → 24 小时倒计时 → 直推技师墙。
// 设计铁律:
//  · 第一屏绝不弹任何权限框、不要任何输入 —— 先让客人看见货(旧版一进来就要手机号,人流失在门口)
//  · 只要手机号不要邮箱 —— 我们发不了邮件,但 WhatsApp 能追;而且菲律宾人背得出手机号
//  · 不爱填表的给 Messenger 侧门 —— 聊天成交是菲律宾主流,AI 在那头接
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
