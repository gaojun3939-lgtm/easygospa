"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Clock, ArrowRight, Loader2, MessageCircle, Star } from 'lucide-react';

// 新客活动券落地页(2026-08-01 老板拍板改版:先亮货、后设卡)。
// 旧版一进来就要手机号 → 客人没看到任何东西就被要东西,流失在门口。
// 新版两屏:第一屏纯展示今晚的技师(不弹定位、不要任何输入,想看就看),
// 客人动了心 → 第二屏才领 ₱150 填手机号;不爱填表的给 Messenger 侧门。
// 券本身仍绑手机号存后台;浏览器只留"我领过、还剩多久"的备忘,换设备照样能用。
const STORAGE_KEY = 'egPromoCoupon.v1';
// 主页 EasySpa Go 的 Messenger 直达链接(菲律宾人爱聊不爱填表,给第二条腿)
const MESSENGER_URL = 'https://m.me/607203729144956';

function peso(value) {
  return `₱${Number(value || 0).toLocaleString('en-US')}`;
}

function countdownText(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// 评分显示规则(老板 2026-08-01 拍板,满分扣分制不变,给星级配分母):
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

export default function WelcomeGift() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState('closed');
  const [coupon, setCoupon] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState('');
  const [therapists, setTherapists] = useState([]);
  const timerRef = useRef(null);
  const claimRef = useRef(null);

  // 第一屏的货:真实技师墙数据。刻意不引 BookingModal——那边会触发定位请求,
  // 这一页的铁律是"看货零门槛",绝不弹任何权限框。拉不到就只显示领券卡(降级不挡路)。
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
      .catch(() => { /* 展示区拉不到就不显示,领券主流程不受影响 */ });
    return () => { alive = false; };
  }, []);

  // 回来的人直接看到自己那张券,不用再领一次
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.expiresAt && Date.parse(saved.expiresAt) > Date.now()) {
        setCoupon(saved);
        setPhone(saved.phone || '');
        setStage('opened');
      }
    } catch { /* 存储不可用就当没领过 */ }
  }, []);

  useEffect(() => {
    if (!coupon?.expiresAt) return undefined;
    const tick = () => setRemaining(Math.max(0, Math.floor((Date.parse(coupon.expiresAt) - Date.now()) / 1000)));
    tick();
    timerRef.current = window.setInterval(tick, 1000);
    return () => window.clearInterval(timerRef.current);
  }, [coupon?.expiresAt]);

  async function openGift(event) {
    event.preventDefault();
    if (stage === 'opening') return;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter your mobile number.');
      return;
    }
    setError('');
    setStage('opening');
    try {
      const response = await fetch('/api/promo-claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone: digits })
      });
      const payload = await response.json().catch(() => null);
      if (!payload?.ok || !payload.coupon) {
        setError(payload?.error || 'Could not open your gift. Please try again.');
        setStage('closed');
        return;
      }
      const next = { ...payload.coupon, phone: digits };
      setCoupon(next);
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* 忽略 */ }
      setStage('opened');
    } catch {
      setError('Could not open your gift. Please try again.');
      setStage('closed');
    }
  }

  const expired = coupon && remaining <= 0;
  const scrollToClaim = () => claimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <div className="min-h-screen bg-[#FDFCF9] px-5 py-10">
      <div className="mx-auto w-full max-w-md">

        {/* ============ 第一屏:先亮货(零门槛,不弹任何权限框) ============ */}
        {therapists.length > 0 ? (
          <section className="mb-8">
            <h1 className="font-serif text-[26px] font-bold leading-tight text-[#0F0F0F]">
              Pick who comes to you
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Licensed therapists · Makati &amp; BGC · No transport fee, no tips
            </p>

            <div className="-mx-5 mt-4 flex gap-3 overflow-x-auto px-5 pb-2" style={{ scrollbarWidth: 'none' }}>
              {therapists.map(therapist => (
                <button
                  className="w-[124px] shrink-0 overflow-hidden rounded-2xl bg-white text-left shadow-sm"
                  key={therapist.id}
                  onClick={scrollToClaim}
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
          </section>
        ) : null}

        {/* ============ 第二屏:动了心,才领券 ============ */}
        <div ref={claimRef}>
          {stage !== 'opened' ? (
            <form className="rounded-3xl bg-white p-7 text-center shadow-lg" onSubmit={openGift}>
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#E24B4A]">
                <Gift className="text-white" size={38} />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#0F0F0F]">₱150 off your first massage</h2>
              <p className="mt-1 text-sm text-gray-500">First booking only · today</p>

              <input
                autoComplete="tel"
                className="mt-6 w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg outline-none focus:border-[#2db83d]"
                inputMode="tel"
                onChange={event => setPhone(event.target.value)}
                placeholder="09XX XXX XXXX"
                type="tel"
                value={phone}
              />
              {error ? <p className="mt-2 text-sm text-[#E24B4A]">{error}</p> : null}

              <button
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2db83d] py-3.5 text-lg font-semibold text-white disabled:opacity-70"
                disabled={stage === 'opening'}
                type="submit"
              >
                {stage === 'opening' ? <Loader2 className="animate-spin" size={20} /> : null}
                {stage === 'opening' ? 'Opening...' : 'Claim my ₱150'}
              </button>

              <p className="mt-3 text-xs leading-5 text-gray-400">
                We&apos;ll text your code and occasional offers.
              </p>

              {/* 不爱填表的客人走聊天侧门(菲律宾主流成交方式),AI 在那头接 */}
              <a
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-[#0F0F0F]"
                href={MESSENGER_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                <MessageCircle size={18} /> Or chat with us on Messenger
              </a>
            </form>
          ) : (
            <div className="rounded-3xl bg-white p-7 text-center shadow-lg">
              <p className="text-sm text-gray-500">Your offer today</p>
              <p className="mt-1 font-serif text-5xl font-bold leading-none text-[#E24B4A]">{peso(coupon?.amount)}</p>
              <p className="mt-2 text-sm text-gray-500">off your first massage</p>

              <div className={`mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${expired ? 'bg-gray-100 text-gray-500' : 'bg-[#FCEBEB] text-[#A32D2D]'}`}>
                <Clock size={16} />
                {expired ? 'This gift has expired' : `Expires in ${countdownText(remaining)}`}
              </div>

              <button
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2db83d] py-3.5 text-lg font-semibold text-white"
                onClick={() => router.push('/?book=1')}
                type="button"
              >
                Pick your therapist <ArrowRight size={20} />
              </button>

              <p className="mt-4 text-xs leading-5 text-gray-500">
                No transport fee. No tips. Cash when she arrives.<br />
                Your discount is applied automatically when you book with this number.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
