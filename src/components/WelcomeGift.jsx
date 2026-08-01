"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BadgeCheck, ShieldCheck, Star, UserCheck } from 'lucide-react';
import { whatsappLink } from '@/lib/contactConfig';

// 广告落地页 v3(2026-08-02 老板拍板,两位外部专家复核一致):
// "领券卡是假步骤"——下单流程里手机号当场查/发 ₱150(2026-07-29 起就不依赖预领),
// 前置 Claim 表单纯属给客人加作业(在线三天 ₱2,000 流量 0 成交)。撤掉。
// 新结构一条道:三条拆"怕"的卖点 → 技师墙(点谁都进下单) → 大按钮进技师墙。
// 聊天入口降级到页尾一行小字(Messenger + WhatsApp):它接的不是要下单的人,
// 是憋着一句 "Is this legit?" 本来要关页走人的人。等口碑攒起来可撤。
// 铁律不变:本页零权限弹窗、零输入门槛;WhatsApp 门还有个隐藏好处——
// 客人先开口 = 24小时窗口打开,下单后的三条 WhatsApp 通知就能百分百送达。
const MESSENGER_URL = 'https://m.me/607203729144956';

// 评分显示规则(老板 2026-08-01 拍板,满分扣分制,星级配分母):
// 没有评价 → 只挂 NEW,不亮裸 5.0;有评价 → 星级 + 条数一起亮。
function TherapistBadge({ therapist }) {
  const reviews = Number(therapist.reviewCount || 0);
  if (!reviews) {
    return <span className="rounded-full bg-[#EAF3DE] px-2 py-0.5 text-[10px] font-bold text-[#3B6D11]">NEW</span>;
  }
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#854F0B]">
      <Star className="fill-[#EF9F27] text-[#EF9F27]" size={11} />
      {Number(therapist.rating || 5).toFixed(1)} · {reviews}
    </span>
  );
}

// 三条卖点:每条正面拆一个"怕"(怕来路不明/怕骗押金/怕不正经)。
// 文案两位专家过审、老板逐句拍板(2026-08-02)。
const SELLING_POINTS = [
  { icon: UserCheck, text: <><strong>You choose who comes to your door</strong> — real therapists, real photos</> },
  { icon: ShieldCheck, text: <><strong>No deposit, no prepayment</strong> — just book, and she&apos;s on her way</> },
  { icon: BadgeCheck, text: <><strong>Strictly professional massage</strong> — licensed, uniformed, ID-verified therapists</> }
];

export default function WelcomeGift() {
  const router = useRouter();
  const [therapists, setTherapists] = useState([]);

  // 技师墙数据。刻意不引 BookingModal——那边会触发定位请求,
  // 这一页的铁律是"看货零门槛"。拉不到就只显示卖点+大按钮(降级不挡路)。
  useEffect(() => {
    let alive = true;
    fetch('/api/booking-catalog', { cache: 'no-store' })
      .then(response => response.json())
      .then(payload => {
        if (!alive) return;
        const list = (Array.isArray(payload?.therapists) ? payload.therapists : [])
          .filter(item => !item.isMannequin && (item.listImageUrl || item.photoUrl))
          .sort((a, b) => Number(b.onShift === true) - Number(a.onShift === true))
          .slice(0, 10);
        setTherapists(list);
      })
      .catch(() => { /* 展示区拉不到不挡路,大按钮照样进主站技师墙 */ });
    return () => { alive = false; };
  }, []);

  // 一条道:点技师、点大按钮,全部进主站技师墙下单流程(₱150 下单时自动生效)
  const goBook = () => router.push('/?book=1');

  return (
    // pt-32 给顶部固定导航让位(LOGO 压标题的重叠 bug 就是原来 py-10 不够高;
    // 导航未滚动态实测底边 ~108-122px,128px 连光晕一起盖住)
    <div className="min-h-screen bg-[#FDFCF9] px-5 pb-10 pt-32">
      <div className="mx-auto w-full max-w-md">

        <h1 className="font-serif text-[26px] font-bold leading-tight text-[#0F0F0F]">
          Pick who comes to you
        </h1>

        {/* ₱150 明写在墙上:优惠当定价用,不当门槛用(下单填手机号时自动生效) */}
        <p className="mt-2 inline-flex items-center rounded-full bg-[#FCEBEB] px-3 py-1 text-[13px] font-bold text-[#A32D2D]">
          ₱150 off your first booking · applied automatically
        </p>

        <ul className="mt-4 space-y-2.5">
          {SELLING_POINTS.map(({ icon: Icon, text }, index) => (
            <li className="flex items-start gap-2.5 text-[13.5px] leading-5 text-gray-600" key={index}>
              <Icon className="mt-0.5 shrink-0 text-[#3B6D11]" size={16} />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        {/* 技师墙:点谁都直接进下单流程 */}
        {therapists.length > 0 ? (
          <div className="-mx-5 mt-5 flex gap-3 overflow-x-auto px-5 pb-2" style={{ scrollbarWidth: 'none' }}>
            {therapists.map(therapist => (
              <button
                className="w-[124px] shrink-0 overflow-hidden rounded-2xl bg-white text-left shadow-sm"
                key={therapist.id}
                onClick={goBook}
                type="button"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- 目录图直链,域名不固定 */}
                <img
                  alt={therapist.name}
                  className="h-[150px] w-full object-cover"
                  loading="lazy"
                  src={therapist.listImageUrl || therapist.photoUrl}
                />
                <div className="px-2.5 py-2">
                  <p className="truncate text-[13px] font-bold text-[#0F0F0F]">{therapist.name}</p>
                  <div className="mt-0.5 flex items-center justify-between">
                    <TherapistBadge therapist={therapist} />
                    {therapist.onShift ? <span className="h-2 w-2 rounded-full bg-[#2db83d]" title="On shift now" /> : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        <button
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2db83d] py-3.5 text-lg font-semibold text-white"
          onClick={goBook}
          type="button"
        >
          Pick your therapist <ArrowRight size={20} />
        </button>

        <p className="mt-3 text-center text-xs leading-5 text-gray-400">
          No transport fee. No tips. Nothing to pay upfront.
        </p>

        {/* 页尾泄压阀:安静的一行字,只接"想先问问正规吗"的人。不做浮窗不弹窗。 */}
        <p className="mt-10 text-center text-xs text-gray-400">
          Questions first?{' '}
          <a className="font-semibold text-gray-500 underline underline-offset-2" href={MESSENGER_URL} rel="noopener noreferrer" target="_blank">Chat on Messenger</a>
          {' '}·{' '}
          <a className="font-semibold text-gray-500 underline underline-offset-2" href={whatsappLink('Hi! I have a question about booking a massage.')} rel="noopener noreferrer" target="_blank">WhatsApp</a>
        </p>

      </div>
    </div>
  );
}
