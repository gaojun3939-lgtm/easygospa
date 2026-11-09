'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, ChevronLeft, Clock, LogOut, Mail, MapPin, MessageCircle, TicketPercent, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getSupabaseClient, isCustomerAuthConfigured } from '../lib/supabaseClient';
import { BOOKING_STATUS_STEPS, bookingStatusMessageKey } from '../lib/bookingStatus.mjs';
import { intlLocale, localePath } from '@/i18n/routing';
import BookingReviewCard, { REVIEW_COUPON_AMOUNT } from './BookingReviewCard.jsx';

const RESEND_SECONDS = 60;
// 验证码长度不写死:Supabase Auth 后台可把邮箱验证码配成 6 位或 8 位,
// 前端两种都收(之前砍死 6 位,8 位的码根本填不进去,客人永远验不过)。
const OTP_MIN_LENGTH = 6;
const OTP_MAX_LENGTH = 8;
const WHATSAPP_FALLBACK = '+63 964 857 0967';
// 评价券有效天数(券包空状态那句话里用)
const REVIEW_COUPON_VALID_DAYS = 30;

// 状态的显示文字按代码去 track 文字文件里查(跟追踪页同一份)
const TIMELINE = BOOKING_STATUS_STEPS.map(step => ({ key: step.status }));

function orderStatusText(tTrack, order) {
  const key = bookingStatusMessageKey(order?.status);
  return (key && tTrack(key)) || order?.statusLabel;
}

// 接口回来的项目名是英文;serviceNames 里有译名就用译名,没有原样显示
function serviceText(tn, name) {
  return tn.has(name) ? tn(name) : name;
}

// 券包接口回来的报错按代码翻;认不出的代码,原样显示接口给的英文
function couponErrorText(t, payload) {
  switch (String(payload?.code || '')) {
    case 'COUPON_WALLET_UNAVAILABLE':
      return t('coupons.errors.unavailable');
    case 'UNAUTHORIZED':
      return t('coupons.errors.signIn');
    default:
      return payload?.error || t('coupons.loadError');
  }
}

// Official Google "G" mark — required by Google's branding guidelines so the
// button reads as genuine (never a hand-drawn substitute).
function GoogleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

function statusIndex(status) {
  const idx = TIMELINE.findIndex(step => step.key === status);
  if (idx >= 0) return idx;
  if (status === 'cancelled') return -1;
  return 0;
}

function formatSchedule(iso, locale) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function statusTone(status) {
  if (status === 'completed') return { dot: '#9a9a95', text: '#8a8a86' };
  if (status === 'cancelled') return { dot: '#c0392b', text: '#c0392b' };
  return { dot: '#64734F', text: '#55633F' };
}

export default function CustomerOrders() {
  const t = useTranslations('orders');
  // 拉券包的回调里要用当前语言的文字,但不能让它变成 loadCoupons 的依赖(会多拉一次接口)
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);
  const configured = isCustomerAuthConfigured();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState('email'); // email | code
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [orders, setOrders] = useState([]);
  const [ordersState, setOrdersState] = useState('idle'); // idle | loading | ready | error
  const [errorDetail, setErrorDetail] = useState('');
  const [coupons, setCoupons] = useState([]);
  const [couponsState, setCouponsState] = useState('idle');
  const [couponError, setCouponError] = useState('');
  const [accountTab, setAccountTab] = useState('orders');
  const [selected, setSelected] = useState(null);
  const timerRef = useRef(null);
  const onClose = useCallback(() => { setSelected(null); setOpen(false); }, []);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener('open-my-orders', openHandler);
    return () => window.removeEventListener('open-my-orders', openHandler);
  }, []);

  useEffect(() => {
    if (!configured) { setReady(true); return; }
    const client = getSupabaseClient();
    if (!client) { setReady(true); return; }
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data?.session || null);
      setReady(true);
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next || null);
    });
    return () => { active = false; sub?.subscription?.unsubscribe?.(); };
  }, [configured]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    timerRef.current = setTimeout(() => setResendIn(value => value - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [resendIn]);

  const loadOrders = useCallback(async () => {
    const token = session?.access_token;
    if (!token) return;
    setOrdersState('loading');
    setErrorDetail('');
    try {
      const response = await fetch('/api/my-bookings', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      let payload = null;
      try { payload = await response.json(); } catch { payload = null; }
      if (!response.ok || !payload || payload.ok === false) {
        const bits = [`HTTP ${response.status}`, payload?.code, payload?.requestId].filter(Boolean);
        setErrorDetail(bits.join(' · '));
        setOrdersState('error');
        return;
      }
      setOrders(Array.isArray(payload.bookings) ? payload.bookings : []);
      setOrdersState('ready');
    } catch (loadError) {
      setErrorDetail(`network · ${String(loadError?.message || loadError).slice(0, 60)}`);
      setOrdersState('error');
    }
  }, [session?.access_token]);

  const loadCoupons = useCallback(async () => {
    const token = session?.access_token;
    if (!token) return;
    setCouponsState('loading');
    setCouponError('');
    try {
      const response = await fetch('/api/my-coupons', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true) {
        setCoupons([]);
        setCouponsState('error');
        setCouponError(couponErrorText(tRef.current, payload));
        return;
      }
      setCoupons(Array.isArray(payload.coupons) ? payload.coupons : []);
      setCouponsState('ready');
    } catch {
      setCoupons([]);
      setCouponsState('error');
      setCouponError(tRef.current('coupons.loadError'));
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (open && session?.access_token) {
      loadOrders();
      loadCoupons();
    }
  }, [open, session?.access_token, loadCoupons, loadOrders]);

  // Poll for live status while an order is open.
  useEffect(() => {
    if (!open || !session?.access_token) return undefined;
    const id = setInterval(loadOrders, 25000);
    return () => clearInterval(id);
  }, [open, session?.access_token, loadOrders]);

  const selectedOrder = useMemo(
    () => orders.find(order => order.reference === selected) || null,
    [orders, selected]
  );
  const activeCouponCount = useMemo(
    () => coupons.filter(coupon => coupon.status === 'active').length,
    [coupons]
  );
  const onReviewSuccess = useCallback(async () => {
    await Promise.all([loadOrders(), loadCoupons()]);
  }, [loadCoupons, loadOrders]);

  async function continueWithGoogle() {
    const client = getSupabaseClient();
    if (!client) return;
    setError('');
    setBusy(true);
    const { error: oauthError } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
    });
    if (oauthError) { setBusy(false); setError(t('login.errors.google')); }
  }

  async function sendEmailCode() {
    const client = getSupabaseClient();
    const target = email.trim().toLowerCase();
    if (!client || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      setError(t('login.errors.invalidEmail'));
      return;
    }
    setError(''); setNotice(''); setBusy(true);
    const { error: otpError } = await client.auth.signInWithOtp({ email: target, options: { shouldCreateUser: true } });
    setBusy(false);
    if (otpError) { setError(t('login.errors.sendFailed')); return; }
    setStep('code');
    setResendIn(RESEND_SECONDS);
    setNotice(t('login.codeSent', { email: target }));
  }

  async function verifyEmailCode() {
    const client = getSupabaseClient();
    const target = email.trim().toLowerCase();
    const token = code.trim();
    if (!client || token.length < OTP_MIN_LENGTH) { setError(t('login.errors.enterCode')); return; }
    setError(''); setBusy(true);
    const { error: verifyError } = await client.auth.verifyOtp({ email: target, token, type: 'email' });
    setBusy(false);
    if (verifyError) { setError(t('login.errors.wrongCode')); return; }
    setCode('');
  }

  async function signOut() {
    const client = getSupabaseClient();
    if (client) await client.auth.signOut();
    setOrders([]); setOrdersState('idle'); setCoupons([]); setCouponsState('idle'); setSelected(null); setAccountTab('orders'); setStep('email'); setEmail(''); setCode('');
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 sm:items-center" role="dialog" aria-modal="true" aria-label={t('title.orders')}>
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] bg-[#f6f7f6] sm:rounded-[1.75rem]">
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <div className="flex items-center gap-2">
            {selectedOrder ? (
              <button type="button" onClick={() => setSelected(null)} aria-label={t('backToOrders')} className="text-gray-500">
                <ChevronLeft className="h-6 w-6" />
              </button>
            ) : null}
            <h2 className="text-lg font-bold text-[#171A17]">{selectedOrder ? t('title.orderStatus') : accountTab === 'coupons' ? t('title.couponWallet') : t('title.orders')}</h2>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <button type="button" onClick={signOut} className="flex items-center gap-1 text-xs font-semibold text-gray-500" aria-label={t('signOut')}>
                <LogOut className="h-4 w-4" />{t('signOut')}
              </button>
            ) : null}
            <button type="button" onClick={onClose} aria-label={t('close')} className="text-gray-500"><X className="h-6 w-6" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {!configured ? (
            <p className="mt-10 text-center text-sm text-gray-500">{t('notConfigured')}</p>
          ) : !ready ? (
            <p className="mt-10 text-center text-sm text-gray-500">{t('loading')}</p>
          ) : !session ? (
            <LoginView
              step={step} email={email} code={code} busy={busy} error={error} notice={notice} resendIn={resendIn}
              onEmail={setEmail} onCode={setCode}
              onGoogle={continueWithGoogle} onSendCode={sendEmailCode} onVerify={verifyEmailCode}
              onResend={sendEmailCode} onBack={() => { setStep('email'); setError(''); setNotice(''); }}
            />
          ) : selectedOrder ? (
            <OrderDetail order={selectedOrder} bookingEmail={session?.user?.email || ''} onReviewSuccess={onReviewSuccess} />
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 rounded-2xl bg-white p-1 shadow-sm" role="tablist" aria-label={t('tabs.label')}>
                <button type="button" role="tab" aria-selected={accountTab === 'orders'} onClick={() => setAccountTab('orders')} className={`h-10 rounded-xl text-sm font-bold ${accountTab === 'orders' ? 'bg-[#64734F] text-white' : 'text-gray-500'}`}>{t('tabs.bookings')}</button>
                <button type="button" role="tab" aria-selected={accountTab === 'coupons'} onClick={() => setAccountTab('coupons')} className={`h-10 rounded-xl text-sm font-bold ${accountTab === 'coupons' ? 'bg-[#64734F] text-white' : 'text-gray-500'}`}>
                  <CouponTabLabel activeCouponCount={activeCouponCount} />
                </button>
              </div>
              {accountTab === 'orders'
                ? <OrdersList state={ordersState} orders={orders} errorDetail={errorDetail} onOpen={setSelected} onRetry={loadOrders} />
                : <CouponWallet state={couponsState} coupons={coupons} error={couponError} onRetry={loadCoupons} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function couponStatusLabel(t, status) {
  if (status === 'active') return t('coupons.status.active');
  if (status === 'used') return t('coupons.status.used');
  return t('coupons.status.expired');
}

function couponStatusTone(status) {
  if (status === 'active') return 'text-[#55633F]';
  if (status === 'used') return 'text-gray-500';
  return 'text-red-600';
}

export function CouponTabLabel({ activeCouponCount = 0 }) {
  const t = useTranslations('orders');
  return (
    <span className="relative inline-flex items-center">
      {t('tabs.coupons')}
      {activeCouponCount > 0 ? <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" data-testid="coupon-active-indicator" aria-label={t('tabs.activeCoupon')} /> : null}
    </span>
  );
}

export function CouponWallet({ state, coupons, error, onRetry }) {
  const t = useTranslations('orders');
  const dateLocale = intlLocale(useLocale());
  if (state === 'loading' || state === 'idle') return <p className="mt-10 text-center text-sm text-gray-500">{t('coupons.loading')}</p>;
  if (state === 'error') {
    return (
      <div className="mt-10 text-center" data-testid="coupon-wallet">
        <p className="text-sm text-gray-500">{error || t('coupons.loadError')}</p>
        <button type="button" onClick={onRetry} className="mt-3 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-[#64734F]">{t('retry')}</button>
      </div>
    );
  }
  if (!coupons.length) {
    return (
      <div className="mt-12 text-center" data-testid="coupon-wallet">
        <TicketPercent className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-base font-semibold text-[#171A17]">{t('coupons.emptyTitle')}</p>
        <p className="mt-1 text-sm leading-6 text-gray-500">{t('coupons.emptyBody', { amount: REVIEW_COUPON_AMOUNT, days: REVIEW_COUPON_VALID_DAYS })}</p>
      </div>
    );
  }
  return (
    <div className="space-y-3" data-testid="coupon-wallet">
      {coupons.map(coupon => (
        <article key={coupon.id} className={`flex min-h-28 overflow-hidden rounded-2xl border bg-white shadow-sm ${coupon.status === 'expired' ? 'border-red-100' : 'border-gray-100'}`}>
          <div className={`flex w-28 shrink-0 flex-col items-center justify-center px-3 text-white ${coupon.status === 'active' ? 'bg-[#64734F]' : 'bg-gray-400'}`}>
            <strong className="text-3xl">₱{Number(coupon.amount || 0).toLocaleString('en-US')}</strong>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider">{t('coupons.badge')}</span>
          </div>
          <div className="min-w-0 flex-1 p-4">
            {coupon.status === 'active' ? <p className="mb-2 text-xs font-extrabold text-[#55633F]">{t('coupons.autoApplied')}</p> : null}
            <div className="flex items-center justify-between gap-2">
              <strong className="text-sm text-[#171A17]">{t('coupons.rewardTitle', { brand: 'EasyGoSpa' })}</strong>
              <span className={`text-xs font-bold ${couponStatusTone(coupon.status)}`}>{couponStatusLabel(t, coupon.status)}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">{t('coupons.terms')}</p>
            <p className={`mt-2 text-xs font-semibold ${coupon.status === 'expired' ? 'text-red-600' : 'text-gray-500'}`}>
              {coupon.status === 'used' && coupon.usedAt ? t('coupons.usedOn', { date: formatSchedule(coupon.usedAt, dateLocale) }) : t('coupons.expiresOn', { date: formatSchedule(coupon.expiresAt, dateLocale) || t('coupons.datePending') })}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

function LoginView({ step, email, code, busy, error, notice, resendIn, onEmail, onCode, onGoogle, onSendCode, onVerify, onResend, onBack }) {
  const t = useTranslations('orders');
  if (step === 'code') {
    return (
      <div className="pt-4">
        <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1 text-sm font-semibold text-gray-500">
          <ChevronLeft className="h-4 w-4" />{t('login.back')}
        </button>
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E9ECE1] text-[#64734F]">
          <Mail className="h-6 w-6" />
        </div>
        <h3 className="text-center text-xl font-bold text-[#171A17]">{t('login.enterCode')}</h3>
        {notice ? <p className="mt-1 text-center text-sm text-gray-500">{notice}</p> : null}
        <input
          value={code}
          onChange={event => onCode(event.target.value.replace(/\D/g, '').slice(0, OTP_MAX_LENGTH))}
          inputMode="numeric" autoComplete="one-time-code" placeholder="••••••"
          className="mt-5 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-2xl font-bold tracking-[0.25em] text-[#171A17] outline-none focus:border-[#64734F]"
        />
        {error ? <p className="mt-3 text-center text-sm text-red-600">{error}</p> : null}
        <button type="button" disabled={busy || code.length < OTP_MIN_LENGTH} onClick={onVerify}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[#64734F] text-base font-bold text-white disabled:opacity-50">
          {busy ? t('login.verifying') : t('login.verify')}
        </button>
        <div className="mt-4 text-center text-sm">
          {resendIn > 0 ? (
            <span className="text-gray-400">{t('login.resendIn', { seconds: resendIn })}</span>
          ) : (
            <button type="button" onClick={onResend} disabled={busy} className="font-semibold text-[#64734F]">{t('login.resend')}</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="mb-8 text-center">
        <p className="text-3xl font-bold text-[#64734F]">EasyGoSpa</p>
        <p className="mt-1.5 text-sm text-gray-500">{t('login.tagline')}</p>
      </div>

      <button type="button" onClick={onGoogle} disabled={busy}
        className="flex h-[52px] w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white text-base font-semibold text-[#171A17] shadow-sm disabled:opacity-60">
        <GoogleGlyph />{t('login.google')}
      </button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">{t('login.orEmail')}</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <input
        value={email}
        onChange={event => onEmail(event.target.value)}
        type="email" autoComplete="email" placeholder="name@email.com"
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-[#171A17] outline-none focus:border-[#64734F]"
      />
      {error ? <p className="mt-3 text-center text-sm text-red-600">{error}</p> : null}
      <button type="button" disabled={busy} onClick={onSendCode}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#64734F] text-base font-bold text-white disabled:opacity-50">
        <Mail className="h-4 w-4" />{busy ? t('login.sending') : t('login.sendCode')}
      </button>
      <p className="mt-4 text-center text-xs text-gray-400">{t('login.noPassword')}</p>
    </div>
  );
}

function OrdersList({ state, orders, errorDetail, onOpen, onRetry }) {
  const t = useTranslations('orders');
  const tTrack = useTranslations('track');
  const tn = useTranslations('serviceNames');
  const dateLocale = intlLocale(useLocale());
  if (state === 'loading' || state === 'idle') return <p className="mt-10 text-center text-sm text-gray-500">{t('list.loading')}</p>;
  if (state === 'error') {
    return (
      <div className="mt-10 text-center">
        <p className="text-sm text-gray-500">{t('list.loadError')}</p>
        {errorDetail ? <p className="mt-1 text-xs text-gray-400">{errorDetail}</p> : null}
        <button type="button" onClick={onRetry} className="mt-3 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-[#64734F]">{t('retry')}</button>
      </div>
    );
  }
  if (!orders.length) {
    return (
      <div className="mt-12 text-center">
        <p className="text-base font-semibold text-[#171A17]">{t('list.emptyTitle')}</p>
        <p className="mt-1 text-sm text-gray-500">{t('list.emptyBody')}</p>
      </div>
    );
  }
  return (
    <div className="space-y-3 pt-2">
      {orders.map(order => {
        const tone = statusTone(order.status);
        return (
          <button key={order.reference} type="button" onClick={() => onOpen(order.reference)}
            className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-[#64734F]/50">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: tone.dot }} />
              <span className="text-xs font-semibold" style={{ color: tone.text }}>{orderStatusText(tTrack, order)}</span>
            </div>
            <p className="mt-1.5 text-[15px] font-bold text-[#171A17]">
              {order.therapist?.name ? `${order.therapist.name} · ` : ''}{order.serviceName ? serviceText(tn, order.serviceName) : t('massage')}
              {order.durationMinutes ? ` ${t('list.duration', { minutes: String(order.durationMinutes) })}` : ''}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              {order.status === 'on_the_way' && order.etaMinutes != null
                ? <span className="font-semibold text-[#55633F]">{t('arriving', { minutes: String(order.etaMinutes) })}</span>
                : <span>{formatSchedule(order.scheduledAt, dateLocale) || formatSchedule(order.placedAt, dateLocale)}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function OrderDetail({ order, bookingEmail, onReviewSuccess }) {
  const t = useTranslations('orders');
  const tTrack = useTranslations('track');
  const tn = useTranslations('serviceNames');
  const locale = useLocale();
  const dateLocale = intlLocale(locale);
  const cancelled = order.status === 'cancelled';
  const current = statusIndex(order.status);
  const whatsapp = (order.whatsapp || WHATSAPP_FALLBACK).replace(/[^\d]/g, '');
  return (
    <div className="pt-2">
      <p className="text-base font-bold text-[#171A17]">
        {order.therapist?.name ? `${order.therapist.name} · ` : ''}{order.serviceName ? serviceText(tn, order.serviceName) : t('massage')}
      </p>
      <p className="mt-0.5 text-sm font-semibold" style={{ color: statusTone(order.status).text }}>
        {order.status === 'on_the_way' && order.etaMinutes != null ? t('arriving', { minutes: String(order.etaMinutes) }) : orderStatusText(tTrack, order)}
      </p>

      {cancelled ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{t('detail.cancelled')}</div>
      ) : (
        <ol className="mt-6 space-y-0">
          {TIMELINE.map((stepItem, index) => {
            const done = index < current;
            const active = index === current;
            const upcoming = index > current;
            return (
              <li key={stepItem.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{
                      background: upcoming ? '#eceae4' : '#64734F',
                      boxShadow: active ? '0 0 0 4px #dcebd5' : 'none'
                    }}>
                    {done ? <Check className="h-3.5 w-3.5 text-white" /> : active ? <Clock className="h-3.5 w-3.5 text-white" /> : null}
                  </span>
                  {index < TIMELINE.length - 1 ? <span className="my-1 w-0.5 flex-1" style={{ background: index < current ? '#64734F' : '#e4e4df' }} /> : null}
                </div>
                <div className={`pb-5 ${active ? '' : ''}`}>
                  <p className="text-sm font-semibold" style={{ color: upcoming ? '#b0b0ab' : '#2a2430' }}>{tTrack(bookingStatusMessageKey(stepItem.key))}</p>
                  {active && order.status === 'on_the_way' && order.etaMinutes != null
                    ? <p className="text-xs font-semibold text-[#55633F]">{t('detail.minAway', { minutes: String(order.etaMinutes) })}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-2 space-y-1 text-xs text-gray-500">
        {order.areaName ? <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{order.areaName}</p> : null}
        {order.scheduledAt ? <p className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatSchedule(order.scheduledAt, dateLocale)}</p> : null}
      </div>

      {order.status === 'completed' ? (
        <BookingReviewCard
          reference={order.reference}
          therapistName={order.therapist?.name || ''}
          bookingEmail={bookingEmail}
          reviewStatus={order.reviewStatus}
          onReviewSuccess={onReviewSuccess}
        />
      ) : null}

      {/* 取消入口(老板 2026-07-28:官网下单发现不能取消——按钮原来只藏在追踪页,这里补上)。
          规矩不变(老板 7/15 定):技师接单前可自己取消;接单后技师可能已出门,走 WhatsApp 人工处理。 */}
      {order.status === 'waiting_acceptance' ? (
        <a href={localePath(locale, `/track/${encodeURIComponent(order.reference)}`)}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-full border border-red-200 bg-white text-sm font-semibold text-red-600">
          {t('detail.cancel')}
        </a>
      ) : !cancelled && order.status !== 'completed' ? (
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`I need to cancel my booking ${order.reference}. Reason: `)}`} target="_blank" rel="noreferrer"
          className="mt-6 flex h-11 w-full items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-500">
          {t('detail.needCancel')}
        </a>
      ) : null}

      <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"
        className={`${order.status === 'waiting_acceptance' || (!cancelled && order.status !== 'completed') ? 'mt-3' : 'mt-6'} flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#E9ECE1] text-sm font-semibold text-[#55633F]`}>
        <MessageCircle className="h-4 w-4" />{t('detail.whatsapp')}
      </a>
      {/* 老板 2026-07-22 对标 Glow:客户订单页加独立投诉入口(现走 WhatsApp 带单号,将来接 AI 客服)。 */}
      <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`I'd like to report a problem with my booking ${order.reference}: `)}`} target="_blank" rel="noreferrer"
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-red-200 text-sm font-semibold text-red-600 transition hover:bg-red-50">
        <AlertTriangle className="h-4 w-4" />{t('detail.report')}
      </a>
    </div>
  );
}
