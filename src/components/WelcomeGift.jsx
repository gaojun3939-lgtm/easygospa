"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Clock, ArrowRight, Loader2 } from 'lucide-react';

// 新客活动券落地页。三个状态:待拆 → 拆开中 → 已拆(倒计时 + 去挑技师)。
// 券本身绑手机号存在后台;这里只在浏览器留一份"我领过、还剩多久"的备忘,
// 客人换设备照样能用(下单时后台按手机号查券,不认浏览器)。
const STORAGE_KEY = 'egPromoCoupon.v1';

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

export default function WelcomeGift() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState('closed');
  const [coupon, setCoupon] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

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

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">

        {stage !== 'opened' ? (
          <form className="rounded-3xl bg-white p-7 shadow-lg text-center" onSubmit={openGift}>
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-[#E24B4A]">
              <Gift className="text-white" size={44} />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#0F0F0F]">Your welcome gift</h1>
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
              {stage === 'opening' ? 'Opening...' : 'Open my gift'}
            </button>

            <p className="mt-3 text-xs leading-5 text-gray-400">
              We&apos;ll text your code and occasional offers.
            </p>
          </form>
        ) : (
          <div className="rounded-3xl bg-white p-7 shadow-lg text-center">
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
  );
}
