import WelcomeGift from '../../components/WelcomeGift';

// 广告落地页 v3(2026-08-02 老板拍板"墙即入口、下单即领券",两位外部专家复核一致)。
// 领券卡整个撤掉:下单流程里手机号当场查/发 ₱150(2026-07-29 起就不依赖预领),
// 前置 Claim 是假步骤(在线三天 ₱2,000 流量 0 成交)。
// 新结构一条道:三条拆"怕"的卖点 → 技师墙(点谁都进下单) → 大按钮。
// 设计铁律:
//  · 全页零权限弹窗、零输入门槛 —— 先让客人看见货
//  · 主流程(卖点→墙→下单)中间不许有任何打岔的口子(老板 2026-08-02 拍板)
//  · 聊天入口只许在页尾一行小字(Messenger+WhatsApp),接"想先问正规吗"的人;口碑起来可撤
//  · 文案不写 "win / lucky / 抽奖" —— 这是优惠券不是博彩,也避开 Meta 的误判
export const metadata = {
  title: 'Pick your therapist · ₱150 off | EasyGo Spa',
  description: 'Choose your therapist, book in 60 seconds. ₱150 off your first booking, applied automatically. No deposit, nothing upfront.',
  // 这是广告落地页,不给搜索引擎收录(免得优惠被当成常态价挂在搜索结果里)
  robots: { index: false, follow: false }
};

export default function WelcomePage() {
  return <WelcomeGift />;
}
