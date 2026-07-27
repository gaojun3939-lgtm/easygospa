'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, ChevronLeft, Clock, LogOut, Mail, MapPin, MessageCircle, TicketPercent, X } from 'lucide-react';
import { getSupabaseClient, isCustomerAuthConfigured } from '../lib/supabaseClient';
import { BOOKING_STATUS_STEPS } from '../lib/bookingStatus.mjs';
import BookingReviewCard from './BookingReviewCard.jsx';

const RESEND_SECONDS = 60;
// 验证码长度不写死:Supabase Auth 后台可把邮箱验证码配成 6 位或 8 位,
// 前端两种都收(之前砍死 6 位,8 位的码根本填不进去,客人永远验不过)。
const OTP_MIN_LENGTH = 6;
const OTP_MAX_LENGTH = 8;
const WHATSAPP_FALLBACK = '+63 964 857 0967';

const TIMELINE = BOOKING_STATUS_STEPS.map(step => ({ key: step.status, label: step.label }));

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

function formatSchedule(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function statusTone(status) {
  if (status === 'completed') return { dot: '#9a9a95', text: '#8a8a86' };
  if (status === 'cancelled') return { dot: '#c0392b', text: '#c0392b' };
  return { dot: '#4E8D43', text: '#3F7838' };
}

export default function CustomerOrders() {
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
        setCouponError(payload?.error || 'Could not load your coupons.');
        return;
      }
      setCoupons(Array.isArray(payload.coupons) ? payload.coupons : []);
      setCouponsState('ready');
    } catch {
      setCoupons([]);
      setCouponsState('error');
      setCouponError('Could not load your coupons.');
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
    if (oauthError) { setBusy(false); setError('Could not open Google sign-in. Please try again.'); }
  }

  async function sendEmailCode() {
    const client = getSupabaseClient();
    const target = email.trim().toLowerCase();
    if (!client || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(''); setNotice(''); setBusy(true);
    const { error: otpError } = await client.auth.signInWithOtp({ email: target, options: { shouldCreateUser: true } });
    setBusy(false);
    if (otpError) { setError('Could not send the code. Please try again in a moment.'); return; }
    setStep('code');
    setResendIn(RESEND_SECONDS);
    setNotice(`We sent a code to ${target}`);
  }

  async function verifyEmailCode() {
    const client = getSupabaseClient();
    const target = email.trim().toLowerCase();
    const token = code.trim();
    if (!client || token.length < OTP_MIN_LENGTH) { setError('Enter the code from your email.'); return; }
    setError(''); setBusy(true);
    const { error: verifyError } = await client.auth.verifyOtp({ email: target, token, type: 'email' });
    setBusy(false);
    if (verifyError) { setError('That code is incorrect or expired. Try again or resend.'); return; }
    setCode('');
  }

  async function signOut() {
    const client = getSupabaseClient();
    if (client) await client.auth.signOut();
    setOrders([]); setOrdersState('idle'); setCoupons([]); setCouponsState('idle'); setSelected(null); setAccountTab('orders'); setStep('email'); setEmail(''); setCode('');
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 sm:items-center" role="dialog" aria-modal="true" aria-label="My orders">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] bg-[#f6f7f6] sm:rounded-[1.75rem]">
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <div className="flex items-center gap-2">
            {selectedOrder ? (
              <button type="button" onClick={() => setSelected(null)} aria-label="Back to orders" className="text-gray-500">
                <ChevronLeft className="h-6 w-6" />
              </button>
            ) : null}
            <h2 className="text-lg font-bold text-[#0F0F0F]">{selectedOrder ? 'Order status' : accountTab === 'coupons' ? 'My coupon wallet' : 'My orders'}</h2>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <button type="button" onClick={signOut} className="flex items-center gap-1 text-xs font-semibold text-gray-500" aria-label="Sign out">
                <LogOut className="h-4 w-4" />Sign out
              </button>
            ) : null}
            <button type="button" onClick={onClose} aria-label="Close" className="text-gray-500"><X className="h-6 w-6" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {!configured ? (
            <p className="mt-10 text-center text-sm text-gray-500">Order sign-in is being set up. Please check back soon.</p>
          ) : !ready ? (
            <p className="mt-10 text-center text-sm text-gray-500">Loading…</p>
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
              <div className="mb-4 grid grid-cols-2 rounded-2xl bg-white p-1 shadow-sm" role="tablist" aria-label="Customer account">
                <button type="button" role="tab" aria-selected={accountTab === 'orders'} onClick={() => setAccountTab('orders')} className={`h-10 rounded-xl text-sm font-bold ${accountTab === 'orders' ? 'bg-[#4E8D43] text-white' : 'text-gray-500'}`}>Bookings</button>
                <button type="button" role="tab" aria-selected={accountTab === 'coupons'} onClick={() => setAccountTab('coupons')} className={`h-10 rounded-xl text-sm font-bold ${accountTab === 'coupons' ? 'bg-[#4E8D43] text-white' : 'text-gray-500'}`}>
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

function couponStatusLabel(status) {
  if (status === 'active') return 'Available';
  if (status === 'used') return 'Used';
  return 'Expired';
}

function couponStatusTone(status) {
  if (status === 'active') return 'text-[#0E6F1A]';
  if (status === 'used') return 'text-gray-500';
  return 'text-red-600';
}

export function CouponTabLabel({ activeCouponCount = 0 }) {
  return (
    <span className="relative inline-flex items-center">
      Coupons
      {activeCouponCount > 0 ? <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" data-testid="coupon-active-indicator" aria-label="Active coupon available" /> : null}
    </span>
  );
}

export function CouponWallet({ state, coupons, error, onRetry }) {
  if (state === 'loading' || state === 'idle') return <p className="mt-10 text-center text-sm text-gray-500">Loading your coupon wallet…</p>;
  if (state === 'error') {
    return (
      <div className="mt-10 text-center" data-testid="coupon-wallet">
        <p className="text-sm text-gray-500">{error || 'Could not load your coupons.'}</p>
        <button type="button" onClick={onRetry} className="mt-3 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-[#4E8D43]">Try again</button>
      </div>
    );
  }
  if (!coupons.length) {
    return (
      <div className="mt-12 text-center" data-testid="coupon-wallet">
        <TicketPercent className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-base font-semibold text-[#0F0F0F]">No coupons yet</p>
        <p className="mt-1 text-sm leading-6 text-gray-500">Review a completed booking to receive a ₱50 coupon valid for 30 days.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3" data-testid="coupon-wallet">
      {coupons.map(coupon => (
        <article key={coupon.id} className={`flex min-h-28 overflow-hidden rounded-2xl border bg-white shadow-sm ${coupon.status === 'expired' ? 'border-red-100' : 'border-gray-100'}`}>
          <div className={`flex w-28 shrink-0 flex-col items-center justify-center px-3 text-white ${coupon.status === 'active' ? 'bg-[#4E8D43]' : 'bg-gray-400'}`}>
            <strong className="text-3xl">₱{Number(coupon.amount || 0).toLocaleString('en-US')}</strong>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider">Coupon</span>
          </div>
          <div className="min-w-0 flex-1 p-4">
            {coupon.status === 'active' ? <p className="mb-2 text-xs font-extrabold text-[#0E6F1A]">Auto-applied on your next booking</p> : null}
            <div className="flex items-center justify-between gap-2">
              <strong className="text-sm text-[#0F0F0F]">EasyGoSpa reward</strong>
              <span className={`text-xs font-bold ${couponStatusTone(coupon.status)}`}>{couponStatusLabel(coupon.status)}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">Valid on any booking · one coupon per booking</p>
            <p className={`mt-2 text-xs font-semibold ${coupon.status === 'expired' ? 'text-red-600' : 'text-gray-500'}`}>
              {coupon.status === 'used' && coupon.usedAt ? `Used ${formatSchedule(coupon.usedAt)}` : `Expires ${formatSchedule(coupon.expiresAt) || 'date pending'}`}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

function LoginView({ step, email, code, busy, error, notice, resendIn, onEmail, onCode, onGoogle, onSendCode, onVerify, onResend, onBack }) {
  if (step === 'code') {
    return (
      <div className="pt-4">
        <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1 text-sm font-semibold text-gray-500">
          <ChevronLeft className="h-4 w-4" />Back
        </button>
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf1e7] text-[#4E8D43]">
          <Mail className="h-6 w-6" />
        </div>
        <h3 className="text-center text-xl font-bold text-[#0F0F0F]">Enter code</h3>
        {notice ? <p className="mt-1 text-center text-sm text-gray-500">{notice}</p> : null}
        <input
          value={code}
          onChange={event => onCode(event.target.value.replace(/\D/g, '').slice(0, OTP_MAX_LENGTH))}
          inputMode="numeric" autoComplete="one-time-code" placeholder="••••••"
          className="mt-5 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-2xl font-bold tracking-[0.25em] text-[#0F0F0F] outline-none focus:border-[#4E8D43]"
        />
        {error ? <p className="mt-3 text-center text-sm text-red-600">{error}</p> : null}
        <button type="button" disabled={busy || code.length < OTP_MIN_LENGTH} onClick={onVerify}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[#4E8D43] text-base font-bold text-white disabled:opacity-50">
          {busy ? 'Verifying…' : 'Verify'}
        </button>
        <div className="mt-4 text-center text-sm">
          {resendIn > 0 ? (
            <span className="text-gray-400">Resend code in {resendIn}s</span>
          ) : (
            <button type="button" onClick={onResend} disabled={busy} className="font-semibold text-[#4E8D43]">Resend code</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="mb-8 text-center">
        <p className="text-3xl font-bold text-[#4E8D43]">EasyGoSpa</p>
        <p className="mt-1.5 text-sm text-gray-500">Your bookings, one tap away</p>
      </div>

      <button type="button" onClick={onGoogle} disabled={busy}
        className="flex h-[52px] w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white text-base font-semibold text-[#0F0F0F] shadow-sm disabled:opacity-60">
        <GoogleGlyph />Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">or use your email</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <input
        value={email}
        onChange={event => onEmail(event.target.value)}
        type="email" autoComplete="email" placeholder="name@email.com"
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-[#0F0F0F] outline-none focus:border-[#4E8D43]"
      />
      {error ? <p className="mt-3 text-center text-sm text-red-600">{error}</p> : null}
      <button type="button" disabled={busy} onClick={onSendCode}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#4E8D43] text-base font-bold text-white disabled:opacity-50">
        <Mail className="h-4 w-4" />{busy ? 'Sending…' : 'Send code'}
      </button>
      <p className="mt-4 text-center text-xs text-gray-400">No password needed · any email works</p>
    </div>
  );
}

function OrdersList({ state, orders, errorDetail, onOpen, onRetry }) {
  if (state === 'loading' || state === 'idle') return <p className="mt-10 text-center text-sm text-gray-500">Loading your orders…</p>;
  if (state === 'error') {
    return (
      <div className="mt-10 text-center">
        <p className="text-sm text-gray-500">Could not load your orders.</p>
        {errorDetail ? <p className="mt-1 text-xs text-gray-400">{errorDetail}</p> : null}
        <button type="button" onClick={onRetry} className="mt-3 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-[#4E8D43]">Try again</button>
      </div>
    );
  }
  if (!orders.length) {
    return (
      <div className="mt-12 text-center">
        <p className="text-base font-semibold text-[#0F0F0F]">No bookings yet</p>
        <p className="mt-1 text-sm text-gray-500">Your bookings will show up here once you book a therapist.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3 pt-2">
      {orders.map(order => {
        const tone = statusTone(order.status);
        return (
          <button key={order.reference} type="button" onClick={() => onOpen(order.reference)}
            className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-[#4E8D43]/50">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: tone.dot }} />
              <span className="text-xs font-semibold" style={{ color: tone.text }}>{order.statusLabel}</span>
            </div>
            <p className="mt-1.5 text-[15px] font-bold text-[#0F0F0F]">
              {order.therapist?.name ? `${order.therapist.name} · ` : ''}{order.serviceName || 'Massage'}
              {order.durationMinutes ? ` ${order.durationMinutes} min` : ''}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              {order.status === 'on_the_way' && order.etaMinutes != null
                ? <span className="font-semibold text-[#3F7838]">Arriving in about {order.etaMinutes} min</span>
                : <span>{formatSchedule(order.scheduledAt) || formatSchedule(order.placedAt)}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function OrderDetail({ order, bookingEmail, onReviewSuccess }) {
  const cancelled = order.status === 'cancelled';
  const current = statusIndex(order.status);
  const whatsapp = (order.whatsapp || WHATSAPP_FALLBACK).replace(/[^\d]/g, '');
  return (
    <div className="pt-2">
      <p className="text-base font-bold text-[#0F0F0F]">
        {order.therapist?.name ? `${order.therapist.name} · ` : ''}{order.serviceName || 'Massage'}
      </p>
      <p className="mt-0.5 text-sm font-semibold" style={{ color: statusTone(order.status).text }}>
        {order.status === 'on_the_way' && order.etaMinutes != null ? `Arriving in about ${order.etaMinutes} min` : order.statusLabel}
      </p>

      {cancelled ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">This booking was cancelled.</div>
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
                      background: upcoming ? '#eceae4' : '#4E8D43',
                      boxShadow: active ? '0 0 0 4px #dcebd5' : 'none'
                    }}>
                    {done ? <Check className="h-3.5 w-3.5 text-white" /> : active ? <Clock className="h-3.5 w-3.5 text-white" /> : null}
                  </span>
                  {index < TIMELINE.length - 1 ? <span className="my-1 w-0.5 flex-1" style={{ background: index < current ? '#4E8D43' : '#e4e4df' }} /> : null}
                </div>
                <div className={`pb-5 ${active ? '' : ''}`}>
                  <p className="text-sm font-semibold" style={{ color: upcoming ? '#b0b0ab' : '#2a2430' }}>{stepItem.label}</p>
                  {active && order.status === 'on_the_way' && order.etaMinutes != null
                    ? <p className="text-xs font-semibold text-[#3F7838]">~{order.etaMinutes} min away</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-2 space-y-1 text-xs text-gray-500">
        {order.areaName ? <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{order.areaName}</p> : null}
        {order.scheduledAt ? <p className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatSchedule(order.scheduledAt)}</p> : null}
      </div>

      {order.status === 'completed' ? (
        <BookingReviewCard
          reference={order.reference}
          therapistName={order.therapist?.name || 'your therapist'}
          bookingEmail={bookingEmail}
          reviewStatus={order.reviewStatus}
          onReviewSuccess={onReviewSuccess}
        />
      ) : null}

      {/* 取消入口(老板 2026-07-28:官网下单发现不能取消——按钮原来只藏在追踪页,这里补上)。
          规矩不变(老板 7/15 定):技师接单前可自己取消;接单后技师可能已出门,走 WhatsApp 人工处理。 */}
      {order.status === 'waiting_acceptance' ? (
        <a href={`/track/${encodeURIComponent(order.reference)}`}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-full border border-red-200 bg-white text-sm font-semibold text-red-600">
          Cancel this booking
        </a>
      ) : !cancelled && order.status !== 'completed' ? (
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`I need to cancel my booking ${order.reference}. Reason: `)}`} target="_blank" rel="noreferrer"
          className="mt-6 flex h-11 w-full items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-500">
          Need to cancel? Message us
        </a>
      ) : null}

      <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"
        className={`${order.status === 'waiting_acceptance' || (!cancelled && order.status !== 'completed') ? 'mt-3' : 'mt-6'} flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#eaf1e7] text-sm font-semibold text-[#3F7838]`}>
        <MessageCircle className="h-4 w-4" />Message us on WhatsApp
      </a>
      {/* 老板 2026-07-22 对标 Glow:客户订单页加独立投诉入口(现走 WhatsApp 带单号,将来接 AI 客服)。 */}
      <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`I'd like to report a problem with my booking ${order.reference}: `)}`} target="_blank" rel="noreferrer"
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-red-200 text-sm font-semibold text-red-600 transition hover:bg-red-50">
        <AlertTriangle className="h-4 w-4" />Report a problem
      </a>
    </div>
  );
}
