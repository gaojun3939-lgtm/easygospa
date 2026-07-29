'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Calendar, Check, Clock, Mail, MapPin, MessageSquare, Phone, Search, ShieldCheck, Star, User, X } from 'lucide-react';
import {
  BOOKING_FLOW_STORAGE_KEY,
  ALL_SERVICE_TYPES_VALUE,
  DEFAULT_THERAPIST_IMAGE_URL,
  concreteTherapistsForWall,
  filterTherapistsForWall,
  findBookingServiceByName,
  findExactDurationOption,
  findWebsiteTherapist,
  getDefaultBookingSession,
  getDefaultDurationOption,
  isValidEmail,
  serviceTypeOptionsForWall,
  servicesForTherapist,
  MAX_SERVICE_DISTANCE_KM,
  SERVICE_RADIUS_LOCATION_REQUIRED_MESSAGE,
  SERVICE_RADIUS_TOO_FAR_MESSAGE,
  THERAPIST_TEMPORARILY_UNAVAILABLE_MESSAGE,
  getTherapistServiceRadiusBlockMessage,
  isUsableCustomerLocation,
  submitBookingWithinServiceRadius,
  therapistDistanceKm
} from '../lib/therapistServiceBookingFlow.mjs';
import { adAttributionMetadata } from '../lib/adAttribution.mjs';
import { getFallbackWebsiteBookingCatalog } from '../lib/bookingCatalogNormalizer.mjs';
import { manilaNowMinutes, manilaToday } from '../lib/manilaTime.js';
import { apiUrl } from '../lib/apiUrl.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';
import {
  clearActiveBooking,
  isActiveBookingReference,
  isPublicBookingCancelToken,
  resolveActiveBookingGate,
  writeActiveBooking
} from '../lib/activeBooking.mjs';
import { cancelPublicBooking } from '../lib/publicBookingCancel.mjs';
import { LocationPicker } from './LocationPicker.jsx';
import { trackMetaEvent } from './MetaPixel.jsx';
import { AddressAutocompleteInput } from './AddressAutocompleteInput.jsx';
import {
  BOOKING_PHONE_COUNTRIES,
  DEFAULT_BOOKING_PHONE_COUNTRY,
  bookingPhoneCountry,
  formatBookingPhoneE164,
  isValidBookingPhone,
  normalizeBookingPhoneInput
} from '../lib/bookingPhone.mjs';
import { resolvedAddressAfterConfirmation } from '../lib/locationConfirmation.mjs';

// 名单会话缓存(60 秒):整页刷新后先把上次名单端上墙,真名单在背后静默刷新。
// 技师上下班仍然实时反映——每次都照常重新拉取,缓存只负责"先有得看"。
const CATALOG_SESSION_CACHE_KEY = 'egBookingCatalogCache.v1';
const CATALOG_SESSION_CACHE_MS = 60_000;

function catalogStatusForPayload(payload) {
  if (!payload || payload.ok !== true || payload.fallback) return 'error';
  const services = Array.isArray(payload.services) ? payload.services : [];
  const therapists = Array.isArray(payload.therapists) ? payload.therapists.filter(therapist => therapist.id !== 'any_available') : [];
  return services.length && therapists.length ? 'ready' : 'empty';
}

function readCatalogSessionCache() {
  if (typeof window === 'undefined') return null;
  try {
    const entry = JSON.parse(window.sessionStorage.getItem(CATALOG_SESSION_CACHE_KEY) || 'null');
    if (!entry || !Number.isFinite(entry.at) || Date.now() - entry.at > CATALOG_SESSION_CACHE_MS) return null;
    return catalogStatusForPayload(entry.payload) === 'ready' ? entry.payload : null;
  } catch {
    return null;
  }
}

function writeCatalogSessionCache(payload) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(CATALOG_SESSION_CACHE_KEY, JSON.stringify({ at: Date.now(), payload }));
  } catch {}
}

// 24/7 service: offer every 30-minute slot across the full day (00:00–23:30).
// Same-day past slots are filtered out later against Manila time.
const timeSlots = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 === 0 ? '00' : '30'}`);
// Minimum lead time (minutes) before the earliest same-day bookable slot.
// Matches the backend bookingBufferMinutes so the "Earliest HH:MM" a therapist
// advertises is actually pickable in the time dropdown.
const BOOKING_LEAD_MINUTES = 30;
const areaOptions = ['BGC', 'Makati', 'Taguig', 'Pasay', 'Ortigas', 'Metro Manila'];
const allServiceAreasValue = 'all_service_areas';
const catalogUnavailableNotice = 'No specific therapist is available right now.';
const catalogUnavailableFollowUp = 'Please try again in a few minutes, or message us on WhatsApp to book.';
const missingProfileIntroduction = 'No profile introduction has been provided yet.';
const phoneErrorMessage = 'Please enter a valid phone number for the selected country.';
const bookingInputClass = 'h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 font-medium text-[#0F0F0F] caret-[#0F0F0F] placeholder:text-gray-500 focus:border-[#4E8D43] focus:outline-none';
const bookingTextareaClass = `${bookingInputClass} min-h-28 resize-none py-3`;
const bookingLabelClass = 'mb-2 block text-sm font-semibold text-slate-800';
const summaryCardClass = 'rounded-[1.5rem] border border-[#4E8D43]/30 bg-[#F1FBF3] p-5 text-sm';
const summaryLabelClass = 'font-semibold text-slate-700';
const summaryValueClass = 'text-right font-semibold text-[#0F0F0F]';
const summaryMoneyClass = 'text-right font-bold text-[#0E6F1A]';

function timeSlotMinutes(value = '') {
  const [hour, minute] = String(value).split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return -1;
  return (hour * 60) + minute;
}

function isSelectableManilaTime(preferredDate, preferredTime) {
  if (!preferredTime || preferredDate !== manilaToday()) return Boolean(preferredTime);
  return timeSlotMinutes(preferredTime) >= manilaNowMinutes() + BOOKING_LEAD_MINUTES;
}

// On-demand booking: no schedule picker — the therapist departs right after
// accepting. We still stamp a Manila date/time (now + lead buffer) because the
// intake service and technician app expect one.
function manilaAsapTime() {
  const total = Math.min(23 * 60 + 55, manilaNowMinutes() + BOOKING_LEAD_MINUTES);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// Owner call (2026-07-29): "book for later" is back, but it may only ever offer
// slots the therapist can genuinely serve — the pre-2026-07-16 picker listed all 48
// half-hours regardless of her shift, which is how customers booked times nobody
// could work. Every time shown here comes from the backend availability check.
const MANILA_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function manilaDayLabel(dateKey = '', dayOffset = 0) {
  if (dayOffset === 0) return 'Today';
  if (dayOffset === 1) return 'Tomorrow';
  const parsed = new Date(`${dateKey}T00:00:00+08:00`);
  if (!Number.isFinite(parsed.getTime())) return dateKey;
  return `${MANILA_WEEKDAYS[parsed.getUTCDay()]} ${dateKey.slice(8, 10)}`;
}

// 技师墙"约稍后"要给客人挑今天/明天/后天——后台档期扫描也只看 3 天。
function manilaDateKeyWithOffset(offset = 0) {
  const ms = Date.parse(`${manilaToday()}T12:00:00+08:00`) + offset * 86400000;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date(ms));
}

// 墙上还没选服务,不知道时长;先按最常见的 60 分钟问"这个点谁能来"。
// 真正的档期校验在选完技师和服务后(表单的按人时段表 + 后端 verifyScheduledSlot)还会各把一道关。
const WALL_TIME_MATCH_DURATION_MINUTES = 60;

function formatScheduleLabel(dateKey = '', time = '') {
  if (!dateKey || !time) return '';
  const today = manilaToday();
  if (dateKey === today) return `Today ${time}`;
  const parsed = new Date(`${dateKey}T00:00:00+08:00`);
  const tomorrow = new Date(`${today}T00:00:00+08:00`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (parsed.toISOString().slice(0, 10) === tomorrow.toISOString().slice(0, 10)) return `Tomorrow ${time}`;
  return `${dateKey} ${time}`;
}

// Area is inferred from the typed address / map pin instead of a manual dropdown.
function inferAreaFromAddress(text = '') {
  const value = String(text || '').toLowerCase();
  if (/bgc|bonifacio|high street/.test(value)) return 'BGC';
  if (/makati|马卡蒂/.test(value)) return 'Makati';
  if (/taguig|塔吉格/.test(value)) return 'Taguig';
  if (/pasay|帕赛/.test(value)) return 'Pasay';
  if (/ortigas/.test(value)) return 'Ortigas';
  if (/mandaluyong/.test(value)) return 'Mandaluyong';
  if (/quezon/.test(value)) return 'Quezon City';
  if (/paranaque|parañaque/.test(value)) return 'Paranaque';
  if (/san juan/.test(value)) return 'San Juan';
  if (/pasig/.test(value)) return 'Pasig';
  if (/manila|马尼拉/.test(value)) return 'Manila';
  return 'Metro Manila';
}

function money(value = 0) {
  return `PHP ${Number(value || 0).toLocaleString('en-US')}`;
}

function peso(value = 0) {
  return `₱${Number(value || 0).toLocaleString('en-US')}`;
}

// 客人在 /welcome 领 ₱150 时填的手机号(WelcomeGift 存的)。
// 券绑在手机号上,下单时这一格必须是同一个号,否则匹配不到。
// 返回本地格式(去掉 0 或 63 前缀),跟表单那一格的写法一致。
function readPromoClaimPhone() {
  try {
    const saved = JSON.parse(window.localStorage.getItem('egPromoCoupon.v1') || 'null');
    if (!saved?.expiresAt || Date.parse(saved.expiresAt) <= Date.now()) return '';
    let digits = String(saved.phone || '').replace(/\D/g, '');
    if (digits.startsWith('63')) digits = digits.slice(2);
    else if (digits.startsWith('0')) digits = digits.slice(1);
    return digits.length === 10 ? digits : '';
  } catch {
    return '';
  }
}

async function customerAuthorizationHeaders() {
  const client = getSupabaseClient();
  if (!client) return {};
  const { data } = await client.auth.getSession();
  const token = String(data?.session?.access_token || '').trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ⚠ 2026-07-29 修:这里原来只在 couponApplied === true 时才显示优惠,
// 而那个标志只代表"账号券(评价送的 ₱50)"命中。新客活动券(/welcome 领的 ₱150)
// 走的是另一条路,couponApplied 永远是 false —— 结果服务器明明减到了 ₱850,
// 界面从头到尾显示 ₱1,000,客人以为券没生效(老板测试时当场发现)。
// 改成看**实际减了多少钱**,哪种券都认;原价加删除线,让客人看得见自己省了钱。
export function couponDiscountAmount(couponPreview) {
  const discount = Number(couponPreview?.couponDiscount);
  return Number.isFinite(discount) && discount > 0 ? discount : 0;
}

// 价格显示的**唯一写法**。2026-07-29 老板连续两次抓到"这一屏 ₱850、下一屏 ₱1,000"
// —— 病根是每一屏各画各的。现在全站只有这一个组件负责画价格,不可能再各说各话。
export function PriceWithDiscount({ amount = 0, discount = 0, mainClassName = '', struckClassName = 'text-sm font-semibold text-gray-400 line-through' }) {
  const gross = Number(amount) || 0;
  const off = Math.max(0, Number(discount) || 0);
  if (off <= 0) return <strong className={mainClassName}>{money(gross)}</strong>;
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <strong className={mainClassName}>{money(Math.max(0, gross - off))}</strong>
      <span className={struckClassName}>{money(gross)}</span>
    </span>
  );
}

export function BookingCouponAmounts({ couponPreview, selectedTotalAmount, promoDiscount = 0 }) {
  // ⚠ 2026-07-29 这里炸过一次,整站白屏:
  // 我加了"服务器预览还没回来时先用技师墙的折扣顶着",于是 discount 可能 > 0
  // 而 couponPreview 还是 null —— 下面直接读 couponPreview.cashToCollect 就抛
  // 「Cannot read properties of null」,整个页面挂掉,客人连单都下不了。
  // 现在所有数都先算好、都有兜底,这一段里不再出现任何直接读 couponPreview 字段的写法。
  const discount = couponDiscountAmount(couponPreview) || Math.max(0, Number(promoDiscount) || 0);
  const gross = Number(couponPreview?.grossServiceAmount ?? selectedTotalAmount) || 0;
  const cashToCollect = Number.isFinite(Number(couponPreview?.cashToCollect))
    ? Number(couponPreview.cashToCollect)
    : Math.max(0, gross - discount);
  return (
    <>
      <div className="flex justify-between gap-4">
        <strong className={summaryLabelClass}>Total</strong>
        <span className={discount > 0 ? 'text-base font-semibold text-gray-400 line-through' : summaryMoneyClass}>
          {peso(gross)}
        </span>
      </div>
      {discount > 0 ? (
        <>
          <div className="flex justify-between gap-4 text-[#0E6F1A]" data-testid="booking-coupon-discount"><strong>Discount</strong><span className="font-bold">− {peso(discount)} (Automatically applied)</span></div>
          <div className="flex items-baseline justify-between gap-4 border-t border-[#4E8D43]/20 pt-3" data-testid="booking-cash-to-collect"><strong className="text-base text-[#0F0F0F]">Cash payment</strong><span className="text-2xl font-extrabold text-[#0F0F0F]">{peso(cashToCollect)}</span></div>
        </>
      ) : null}
    </>
  );
}

export function BookingCouponSelector({
  couponPreviewState,
  couponPreview,
  couponOptOut,
  onRetry,
  onOptOut,
  onUseCoupon
}) {
  return (
    <section className="rounded-[1.5rem] border border-gray-200 bg-white p-5" data-testid="booking-coupon-selector">
      <h4 className="font-bold text-[#0F0F0F]">Coupon</h4>
      <p className="mt-1 text-xs leading-5 text-gray-500">We securely match active coupons from the signed-in account for this booking email.</p>
      <div className="mt-4" aria-live="polite">
        {couponPreviewState === 'loading' ? <p className="text-sm text-gray-500">Checking for an active coupon…</p> : null}
        {couponPreviewState === 'error' ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">We could not confirm your coupon and cash total.</p>
            <button type="button" onClick={onRetry} className="mt-2 text-sm font-bold text-[#3F7838]">Try again</button>
          </div>
        ) : null}
        {/* ⚠ 2026-07-29:下面几条原来全按 couponApplied 分支,而新客活动券那个标志永远是 false,
            于是刚领了 ₱150 的客人会看到「Sign in to My orders 才能用券」—— 完全误导。
            现在统一按"实际减了多少钱"判断:减了就说减了,是哪种券客人不需要知道。
            「不用券」那个开关只对账号券有意义,活动券不给这个选项(它是广告给的,没人想退掉)。 */}
        {couponPreviewState === 'ready' && couponDiscountAmount(couponPreview) > 0 ? (
          <div className="rounded-2xl bg-[#F1FBF3] p-4">
            <p className="text-sm font-bold text-[#0E6F1A]">{peso(couponDiscountAmount(couponPreview))} off — automatically applied</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">Your discount is already in the cash total below. Nothing else to do.</p>
            {couponPreview?.couponApplied === true ? (
              <button type="button" onClick={onOptOut} className="mt-3 text-xs font-bold text-gray-500 underline decoration-gray-300 underline-offset-4">Don&apos;t use coupon</button>
            ) : null}
          </div>
        ) : null}
        {couponPreviewState === 'ready' && couponDiscountAmount(couponPreview) === 0 && couponOptOut ? (
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-600">Coupon not applied. You will pay the full amount.</p>
            <button type="button" onClick={onUseCoupon} className="mt-3 text-xs font-bold text-[#3F7838] underline decoration-[#4E8D43]/40 underline-offset-4">Use coupon automatically</button>
          </div>
        ) : null}
        {couponPreviewState === 'ready' && couponDiscountAmount(couponPreview) === 0 && !couponOptOut ? (
          couponPreview?.customerIdentityVerified === true
            ? <p className="text-sm text-gray-500">No active coupon was found. This booking stays at the full amount.</p>
            : <p className="text-sm text-gray-500">No discount on this booking. If you claimed a welcome gift, use the same mobile number below.</p>
        ) : null}
      </div>
    </section>
  );
}

// ⚡ now vs 🕘 later. "Now" stays the default and stays one tap — the ride-hailing
// flow is what most customers want and it must not get slower. "Later" is the second
// door, for the guest who is out and gets home at 22:30.
function ScheduleChooser({ mode, onModeChange, slot, onSlotChange, days, loading, loadFailed, earliestLabel, therapistName }) {
  const activeDate = slot?.date || days[0]?.date || '';
  const activeDay = days.find(day => day.date === activeDate) || days[0] || null;
  const optionClass = active => `flex-1 rounded-2xl border-2 px-4 py-3 text-center transition ${active
    ? 'border-[#4E8D43] bg-[#F1FBF3] text-[#3F7838]'
    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`;

  return (
    <div className="space-y-3" data-testid="schedule-chooser">
      <label className={bookingLabelClass}><Clock className="mr-2 inline h-4 w-4" />When would you like your massage?</label>
      <div className="flex gap-3">
        <button type="button" className={optionClass(mode === 'asap')} onClick={() => onModeChange('asap')} data-testid="schedule-mode-asap">
          <span className="block text-sm font-bold">As soon as possible</span>
          <span className="mt-0.5 block text-xs font-medium opacity-80">Therapist departs after accepting</span>
        </button>
        <button type="button" className={optionClass(mode === 'scheduled')} onClick={() => onModeChange('scheduled')} data-testid="schedule-mode-later">
          <span className="block text-sm font-bold">Book for later</span>
          <span className="mt-0.5 block text-xs font-medium opacity-80">Pick a time that suits you</span>
        </button>
      </div>

      {mode === 'asap' ? (
        <div className="rounded-2xl bg-[#eaf1e7] px-4 py-3 text-sm font-medium text-[#3F7838]">
          <Clock className="mr-2 inline h-4 w-4" />Your therapist departs as soon as the booking is accepted — no scheduling needed.
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600">Checking {therapistName || 'her'} schedule…</div>
      ) : loadFailed ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" data-testid="schedule-load-failed">
          We could not load her free times just now. Choose <strong>As soon as possible</strong>, or message us on WhatsApp and we will book the time you want.
        </div>
      ) : !days.length ? (
        // Fail loudly rather than showing an empty list — an empty picker is exactly
        // what sent the 2026-07-29 guest to WhatsApp asking "is there any time?".
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" data-testid="schedule-no-slots">
          {therapistName || 'This therapist'} has no open times in the next three days
          {earliestLabel ? <> — her next opening is <strong>{earliestLabel}</strong></> : null}.
          Pick <strong>As soon as possible</strong>, choose another therapist, or message us on WhatsApp and we will arrange it.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {days.map(day => (
              <button
                key={day.date}
                type="button"
                onClick={() => onSlotChange({ date: day.date, time: '' })}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition ${day.date === activeDate
                  ? 'border-[#4E8D43] bg-[#4E8D43] text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#4E8D43]'}`}
              >
                {manilaDayLabel(day.date, day.dayOffset)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" data-testid="schedule-time-grid">
            {(activeDay?.times || []).map(time => (
              <button
                key={`${activeDate}-${time}`}
                type="button"
                onClick={() => onSlotChange({ date: activeDate, time })}
                className={`rounded-xl border px-2 py-2.5 text-sm font-bold transition ${slot?.date === activeDate && slot?.time === time
                  ? 'border-[#4E8D43] bg-[#F1FBF3] text-[#3F7838]'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#4E8D43]'}`}
                data-testid={`schedule-time-${time}`}
              >
                {time}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">Only times {therapistName || 'she'} can actually take are shown.</p>
        </div>
      )}
    </div>
  );
}

function formatReviewDate(value) {
  if (!value) return 'Recently';
  try {
    return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  } catch {
    return 'Recently';
  }
}

// 评分 Glow 式:一颗金星 + 评分数(橙色)+(N reviews)。
// 新技师 5.0 起步(冷启动:0 分会吓跑客人、新人永远接不到第一单);
// 但配合 NEW 标 + 明写(0 reviews),拿起步分的商业好处又不算骗人。
// 攒够真评价后 rating/reviewCount 有值,自动切成真实平均分。
function TherapistRating({ therapist = {} }) {
  const ratingRaw = Number(therapist.rating);
  const countRaw = Number(therapist.reviewCount);
  const hasReviews = Number.isFinite(ratingRaw) && ratingRaw > 0 && Number.isFinite(countRaw) && countRaw > 0;
  const rating = hasReviews ? Math.min(5, ratingRaw) : 5;
  const reviewCount = hasReviews ? countRaw : 0;

  return (
    <span
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars from ${reviewCount} verified reviews`}
    >
      <Star className="h-4 w-4 shrink-0 fill-[#f0a41c] text-[#f0a41c]" aria-hidden="true" />
      <span className="font-bold text-[#e08700]">{rating.toFixed(1)}</span>
      <span className="font-medium text-gray-500">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
    </span>
  );
}

function therapistAreaText(therapist = {}) {
  const areas = Array.isArray(therapist.serviceAreas) ? therapist.serviceAreas.filter(Boolean) : [];
  if (areas.length) return areas.join(', ');
  const area = String(therapist.serviceArea || '').trim();
  if (area) return area;
  const label = String(therapist.distanceLabel || '').trim();
  return label || 'Metro Manila coverage depends on schedule';
}

function serviceToCatalogName(service = {}) {
  return service?.name || '';
}

function createInitialForm(serviceName = '', services = undefined) {
  const matchedService = findBookingServiceByName(serviceName, services);
  const durationOption = matchedService ? getDefaultDurationOption(matchedService) : null;
  return {
    customerName: '',
    customerEmail: '',
    phone: '',
    requestedTechnicianId: '',
    preferredService: matchedService?.name || serviceName || '',
    serviceId: matchedService?.id || '',
    service: matchedService?.name || '',
    durationMinutes: durationOption?.durationMinutes || '',
    totalAmount: durationOption?.price || 0,
    preferredDate: '',
    preferredTime: '',
    area: '',
    addressNote: '',
    customerLocation: null,
    notes: ''
  };
}

function resolveSelectedServiceOption(formData, services = undefined) {
  const service = findBookingServiceByName(formData.service, services);
  if (!service) return null;
  const option = findExactDurationOption(service, formData.durationMinutes);
  if (!option) return null;
  return {
    service,
    serviceId: service.id,
    durationMinutes: option.durationMinutes,
    price: option.price,
    currency: 'PHP'
  };
}

function readStoredSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(BOOKING_FLOW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidEmail(parsed.customerEmail) ? parsed : null;
  } catch {
    return null;
  }
}

function saveStoredSession(session) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(BOOKING_FLOW_STORAGE_KEY, JSON.stringify(session));
}

function isApprovedTherapistImage(url = '') {
  const value = String(url || '').trim();
  if (value.startsWith('/images/') && !value.startsWith('//')) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:'
      && /\.supabase\.co$/i.test(parsed.hostname)
      && parsed.pathname.startsWith('/storage/v1/object/public/therapist-images/');
  } catch {
    return false;
  }
}

function resolveTherapistImageUrl(therapist = {}, mode = 'wall') {
  const candidates = mode === 'detail'
    ? [therapist.detailImageUrl, therapist.avatarUrl, therapist.photoUrl, therapist.imageUrl, therapist.listImageUrl]
    : [therapist.listImageUrl, therapist.avatarUrl, therapist.photoUrl, therapist.imageUrl];
  return candidates.find(isApprovedTherapistImage)
    || (isApprovedTherapistImage(therapist.fallbackImageUrl) ? therapist.fallbackImageUrl : DEFAULT_THERAPIST_IMAGE_URL);
}

function TherapistAvatar({ therapist, mode = 'wall' }) {
  const imageUrl = resolveTherapistImageUrl(therapist, mode);
  const isFallback = imageUrl === DEFAULT_THERAPIST_IMAGE_URL;
  // 老板 2026-07-24:88px 小方块把竖构图人像裁得看不全、挤。改大的竖版(4:5),
  // 让技师看得全、舒服(对标对手)。
  const sizeClass = mode === 'wall' ? 'h-[152px] w-[114px]' : 'h-full w-full';
  const radiusClass = mode === 'wall' ? 'rounded-[1.25rem]' : 'rounded-none';
  // Owner report (2026-07-19): full-body detail photos were cropped to the torso;
  // top-anchored crop then scalped centered portraits (2026-07-21). Fixed-anchor
  // cropping loses either way, so the detail hero shows the WHOLE photo
  // letterboxed on the dark backdrop — same treatment as the multi-photo carousel.
  const fitClass = isFallback
    ? `${mode === 'wall' ? 'p-2' : 'p-6'} object-contain`
    : 'object-cover object-top';

  return (
    <img
      src={imageUrl}
      alt={`${therapist.name} therapist`}
      loading="lazy"
      decoding="async"
      data-testid={mode === 'detail' ? 'therapist-detail-image' : 'therapist-list-image'}
      className={`${sizeClass} ${radiusClass} ${fitClass} shrink-0 bg-[#EAF8ED] ring-1 ring-gray-200`}
    />
  );
}

function TherapistWallCard({ therapist, selected, onSelect, onRequireLocation, customerLocated = false }) {
  // 超出 10km 或距离未知:卡片照常显示(墙不能空),但点不动。
  const distanceKm = therapistDistanceKm(therapist);
  const rangeBlockMessage = getTherapistServiceRadiusBlockMessage(therapist);
  const rangeBlocked = Boolean(rangeBlockMessage);
  const outOfRange = distanceKm !== null && distanceKm > MAX_SERVICE_DISTANCE_KM;
  const [showRangeHint, setShowRangeHint] = useState(false);

  useEffect(() => {
    if (!showRangeHint) return undefined;
    const timer = setTimeout(() => setShowRangeHint(false), 2600);
    return () => clearTimeout(timer);
  }, [showRangeHint]);

  // 工具人只展示不可下单:点卡片不进详情(老板 2026-07-19)。
  const openDetail = () => {
    if (therapist.isMannequin) return;
    if (rangeBlocked) {
      // 距离未知分两种:客人没给位置 → 开定位入口让他补(老板 2026-07-20 拍板,
      // 拒绝过浏览器定位的客人不能无路可走);客人给了位置但这位技师仍算不出
      // 距离 → 技师侧无坐标,只提示"暂不可约",别再弹定位框怪客人。
      if (distanceKm === null && !customerLocated && typeof onRequireLocation === 'function') onRequireLocation();
      setShowRangeHint(true);
      return;
    }
    onSelect(therapist.id);
  };
  const handleKeyDown = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetail();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={handleKeyDown}
      data-testid={`therapist-card-${therapist.id}`}
      className={`relative w-full cursor-pointer overflow-hidden rounded-[1.5rem] border bg-white p-3 text-left shadow-sm transition-all ${selected ? 'border-[#4E8D43] shadow-md' : 'border-gray-100 hover:border-[#4E8D43]/60 hover:shadow-md'}`}
    >
      {therapist.isNew === true ? <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-sky-600 px-2 py-1 text-[10px] font-extrabold leading-none tracking-[0.12em] text-white shadow-sm" data-testid="therapist-new-badge">NEW</span> : null}
      {showRangeHint ? (
        <span
          role="status"
          data-testid={`therapist-card-out-of-range-hint-${therapist.id}`}
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-black/85 px-4 py-3 text-center text-sm font-semibold leading-5 text-white shadow-lg"
        >
          {distanceKm !== null ? SERVICE_RADIUS_TOO_FAR_MESSAGE : customerLocated ? THERAPIST_TEMPORARILY_UNAVAILABLE_MESSAGE : SERVICE_RADIUS_LOCATION_REQUIRED_MESSAGE}
        </span>
      ) : null}
      <div className="flex min-h-[152px] gap-4">
        <TherapistAvatar therapist={therapist} mode="wall" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate text-[17px] font-bold leading-6 text-[#0F0F0F]">{therapist.name}</h3>
            {/* Owner call (2026-07-18): show the earliest slot even off-shift —
                the backend now sends cross-day values like "Tomorrow 09:00". */}
            {therapist.earliestAvailable ? (
              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold leading-5 text-[#3F7838]" data-testid="therapist-earliest-availability">
                <Clock className="h-3.5 w-3.5 shrink-0" />Earliest {therapist.earliestAvailable}
              </span>
            ) : null}
            {selected ? <Check className="h-4 w-4 shrink-0 text-[#4E8D43]" /> : null}
          </div>
          {/* 老板 2026-07-24:卡片只留精华(名字/评分/距离/Book),对标对手一屏 6 个。
              删掉 Massage Therapist、覆盖区一长串、自我介绍——都挪到点进去的详情页。 */}
          <div className="mt-1.5 text-sm font-bold text-gray-700"><TherapistRating therapist={therapist} /></div>
          {distanceKm !== null && distanceKm <= 100 ? (
            <p className={`mt-2 flex items-center gap-1 text-xs font-semibold ${outOfRange ? 'text-gray-400' : 'text-[#3F7838]'}`} data-testid="therapist-distance">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km
              {outOfRange ? <span data-testid="therapist-out-of-range-tag"> · Too far</span> : null}
            </p>
          ) : null}
          <div className="mt-auto flex min-h-11 items-center justify-end gap-3 pt-2">
            {therapist.isMannequin ? (
              <span className="ml-auto inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-gray-100 px-4 text-sm font-bold text-gray-500" data-testid={`therapist-card-resting-${therapist.id}`}>Resting</span>
            ) : (
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                openDetail();
              }}
              data-testid={`therapist-card-book-${therapist.id}`}
              aria-disabled={rangeBlocked || undefined}
              className={`ml-auto inline-flex h-11 min-w-20 shrink-0 items-center justify-center rounded-full px-4 text-sm font-bold transition ${rangeBlocked ? 'cursor-not-allowed bg-gray-200 text-gray-500' : 'bg-[#4E8D43] text-white hover:bg-[#3F7838]'}`}
            >
              Book
            </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// 默认档 = 60 分钟,没有 60 分钟档就取最短档(老板 2026-07-21:客人要一眼看到价格)。
function defaultDurationOption(service) {
  const options = Array.isArray(service?.durationOptions) ? service.durationOptions : [];
  if (!options.length) return null;
  return options.find(option => Number(option.durationMinutes) === 60)
    || [...options].sort((a, b) => Number(a.durationMinutes) - Number(b.durationMinutes))[0];
}

function ServiceCard({ service, selected, selectedDuration, onSelectService, onSelectDuration, onBook, promoDiscount = 0 }) {
  // 档位药丸常驻卡面(老板 2026-07-21 参考打车式竞品):没选中的卡也能看到
  // 60/90/120 全档,点任意档 = 同时选中该服务和该档;价格大字实时跟着档位走。
  const selectedOption = selected
    ? service.durationOptions.find(option => option.durationMinutes === selectedDuration) || null
    : null;
  const priceOption = selectedOption || defaultDurationOption(service);

  return (
    <section
      className={`cursor-pointer overflow-hidden rounded-[1.5rem] border shadow-sm transition-all ${selected ? 'border-[#4E8D43] bg-[#F1FBF3] ring-1 ring-[#4E8D43]/20' : 'border-gray-200 bg-white hover:border-[#4E8D43]/50 hover:shadow-md'}`}
      data-testid={`therapist-service-${service.id}`}
      onClick={() => onSelectService(service)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="block min-w-0 flex-1 text-lg font-bold text-[#0F0F0F]">{service.name}</span>
          <button
            type="button"
            onClick={event => { event.stopPropagation(); onSelectService(service); }}
            data-testid={`service-select-${service.id}`}
            aria-pressed={selected}
            aria-label={`Select ${service.name}`}
            className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${selected ? 'border-[#4E8D43] bg-[#4E8D43] text-white' : 'border-gray-300 bg-white text-transparent'}`}
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-sm leading-6 text-gray-600 line-clamp-2">{service.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {service.durationOptions.map(option => {
            const durationSelected = selected && selectedDuration === option.durationMinutes;
            return (
              <button
                key={`${service.id}-${option.durationMinutes}`}
                type="button"
                onClick={event => { event.stopPropagation(); onSelectDuration(service, option); }}
                data-testid="service-duration-option"
                aria-pressed={durationSelected}
                className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-all ${durationSelected ? 'border-[#4E8D43] bg-[#E8F5E9] text-[#3F7838]' : 'border-gray-200 bg-white text-gray-700 hover:border-[#4E8D43]/60'}`}
              >
                {option.durationMinutes} mins
                {durationSelected ? <Check className="h-4 w-4" /> : null}
              </button>
            );
          })}
        </div>
        {priceOption ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            {/* 折扣拿到之后,这里直接显示折后价 + 划掉的原价。
                老板 2026-07-29:"点 book 的时候就应该能看到 850" —— 客人得在挑服务
                这一刻就看见自己省了多少,不能等到最后一步才揭晓。 */}
            <div className="flex items-baseline gap-1.5" data-testid={`service-price-${service.id}`}>
              <PriceWithDiscount amount={priceOption.price} discount={promoDiscount} mainClassName="text-2xl font-extrabold text-[#0F0F0F]" />
              <span className="text-xs font-semibold text-gray-500">/ {priceOption.durationMinutes} mins</span>
            </div>
            {/* Book 长在选中的卡片里(老板 2026-07-21:底部长条挡视野,不要了)。 */}
            {selected && selectedOption ? (
              <button
                type="button"
                onClick={event => { event.stopPropagation(); onBook?.(); }}
                data-testid="detail-book"
                className="inline-flex h-11 min-w-24 shrink-0 items-center justify-center rounded-full bg-[#4E8D43] px-6 font-bold text-white transition hover:bg-[#3F7838]"
              >
                Book
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TherapistDetail({ therapist, availableServices, selectedServiceName, selectedDuration, totalAmount, onSelectService, onSelectDuration, onBack, onBook, promoDiscount = 0 }) {
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState('');
  const aboutText = String(therapist.profileIntroduction || '').trim() || missingProfileIntroduction;
  const shouldClampAbout = aboutText.length > 170;
  const detailImageUrl = resolveTherapistImageUrl(therapist, 'detail');
  const usesFallbackImage = detailImageUrl === DEFAULT_THERAPIST_IMAGE_URL;
  const detailDistanceKm = therapistDistanceKm(therapist);
  // 老板 2026-07-19:主图 + 已批准生活照 合成一个可左右滑的相册放最顶部(不再分两块)。
  const heroPhotos = Array.from(new Set([
    ...(usesFallbackImage ? [] : [detailImageUrl]),
    ...((Array.isArray(therapist.lifePhotos) ? therapist.lifePhotos : []))
  ].filter(url => /^https?:\/\//i.test(String(url || '')))));
  const [photoIndex, setPhotoIndex] = useState(0);
  const reviewCount = Math.max(0, Number(therapist.reviewCount) || 0);
  const averageRating = reviewCount > 0 && Number(therapist.rating) > 0 ? Math.min(5, Number(therapist.rating)) : 5;
  const reviewDistribution = therapist.ratingDistribution && typeof therapist.ratingDistribution === 'object' ? therapist.ratingDistribution : {};
  const verifiedReviews = Array.isArray(therapist.verifiedReviews) ? therapist.verifiedReviews : [];
  const visibleReviews = showAllReviews ? verifiedReviews : verifiedReviews.slice(0, 3);
  const heroScrollRef = React.useRef(null);
  const onHeroScroll = () => {
    const el = heroScrollRef.current;
    if (!el || !el.clientWidth) return;
    setPhotoIndex(Math.round(el.scrollLeft / el.clientWidth));
  };
  // 桌面没有触摸滑动 → 用箭头/圆点按页翻(老板 2026-07-19)。
  const goToPhoto = (index) => {
    const el = heroScrollRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(heroPhotos.length - 1, index));
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    setPhotoIndex(next);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-8" data-testid="therapist-detail-view">
      <section className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm" data-testid="therapist-detail-hero">
        {/* 老板 2026-07-24:大图容器定成 4:5 竖版 + 填满,不再两边黑边(对标对手)。
            配合上传自动裁 4:5,新照片刚好铺满不裁;老照片重传即正。 */}
        <div className={`relative mx-auto bg-[#11150f] ${usesFallbackImage && heroPhotos.length === 0 ? 'h-[152px] sm:h-[180px]' : 'aspect-[3/4] max-h-[72vh] w-full max-w-[440px] sm:rounded-[1.25rem]'}`}>
          {heroPhotos.length > 1 ? (
            <>
              <div ref={heroScrollRef} onScroll={onHeroScroll} className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth" data-testid="therapist-hero-carousel" style={{ scrollbarWidth: 'none' }}>
                {heroPhotos.map((url, index) => (
                  <button key={url} type="button" onClick={() => setLightboxUrl(url)} className="flex h-full w-full shrink-0 snap-center items-center justify-center">
                    <img src={url} alt={`${therapist.name} photo ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" className="h-full w-full object-cover object-top" />
                  </button>
                ))}
              </div>
              {photoIndex > 0 ? <button type="button" onClick={() => goToPhoto(photoIndex - 1)} aria-label="Previous photo" data-testid="hero-prev" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow"><ArrowLeft className="h-5 w-5" /></button> : null}
              {photoIndex < heroPhotos.length - 1 ? <button type="button" onClick={() => goToPhoto(photoIndex + 1)} aria-label="Next photo" data-testid="hero-next" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow"><ArrowLeft className="h-5 w-5 rotate-180" /></button> : null}
              <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white" data-testid="therapist-hero-counter">{photoIndex + 1}/{heroPhotos.length}</span>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {heroPhotos.map((url, index) => <button key={url} type="button" aria-label={`Go to photo ${index + 1}`} onClick={() => goToPhoto(index)} className={`h-1.5 rounded-full transition-all ${index === photoIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`} />)}
              </div>
            </>
          ) : (
            <TherapistAvatar therapist={therapist} mode="detail" />
          )}
          <button type="button" onClick={onBack} className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-sm" aria-label="Back to therapist list"><ArrowLeft className="h-5 w-5" /></button>
          {usesFallbackImage && heroPhotos.length === 0 ? <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#3F7838]">EasyGoSpa therapist profile</span> : null}
        </div>
        <div className="p-5">
          <h3 className="text-3xl font-bold tracking-normal text-[#0F0F0F]">{therapist.name}</h3>
          {/* 老板 2026-07-21 对标 Glow:名字下一行"距离 · 金星评分(评价数)",
              撤掉 Available after confirmation / 项目标签等杂物(项目下面 My Services 有)。 */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-gray-700">
            {detailDistanceKm !== null ? (
              <span className="inline-flex items-center gap-1" data-testid="therapist-detail-distance">
                <MapPin className="h-4 w-4 text-gray-500" />
                {detailDistanceKm < 10 ? detailDistanceKm.toFixed(1) : Math.round(detailDistanceKm)} km
              </span>
            ) : null}
            {detailDistanceKm !== null ? <span className="text-gray-300">|</span> : null}
            {/* 评分可点:跳到下方 Verified reviews 区(老板 2026-07-26:1 review 点不进去=没实装) */}
            <button
              type="button"
              data-testid="therapist-rating-link"
              className="inline-flex items-center gap-1 underline decoration-[#e08700]/40 underline-offset-4"
              onClick={() => document.getElementById('therapist-reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              <TherapistRating therapist={therapist} />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-4 rounded-2xl border border-[#4E8D43]/35 bg-[#F7FCF8] px-4 py-3" data-testid="therapist-care">
            <span className="flex flex-col items-center gap-1 text-[#3F7838]">
              <ShieldCheck className="h-7 w-7" />
              <span className="text-[11px] font-bold leading-none">EasyGoSpa Care</span>
            </span>
            <span className="grid gap-1.5 text-sm text-gray-800">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-[#3F7838]" />No tip, no travel fee</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-[#3F7838]" />No sensitive information required</span>
            </span>
          </div>
        </div>
      </section>
      {/* 老板 2026-07-19:原单独的"Photos"块已合进顶部相册,这里不再重复展示。 */}
      {lightboxUrl ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/85 p-4" role="dialog" aria-modal="true" onClick={() => setLightboxUrl('')}>
          <button type="button" aria-label="Close" onClick={() => setLightboxUrl('')} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"><X className="h-5 w-5" /></button>
          <img src={lightboxUrl} alt={`${therapist.name} photo`} className="max-h-[85vh] max-w-full rounded-2xl object-contain" onClick={event => event.stopPropagation()} />
        </div>
      ) : null}
      <section className="rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-sm" data-testid="therapist-about">
        <h3 className="mb-2 text-xl font-bold text-[#0F0F0F]">About {therapist.name}</h3>
        <p className={`text-sm leading-7 text-gray-700 ${shouldClampAbout && !showFullAbout ? 'line-clamp-4' : ''}`}>{aboutText}</p>
        {shouldClampAbout ? (
          <button type="button" onClick={() => setShowFullAbout(current => !current)} className="mt-2 text-sm font-bold text-[#3F7838]">
            {showFullAbout ? 'Show less' : 'Show more'}
          </button>
        ) : null}
      </section>
      <div data-testid="therapist-services">
        <h3 className="text-2xl font-bold text-[#0F0F0F]">My Services</h3>
        <p className="mt-1 text-sm text-gray-600">Real bookable services and prices from the public catalog.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {availableServices.map(service => <ServiceCard key={service.id} service={service} selected={selectedServiceName === service.name} selectedDuration={selectedServiceName === service.name ? Number(selectedDuration) : 0} onSelectService={onSelectService} onSelectDuration={onSelectDuration} onBook={onBook} promoDiscount={promoDiscount} />)}
        </div>
      </div>
      <section className="rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-sm" data-testid="therapist-review-wall" id="therapist-reviews-section">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-[#f0a41c] text-[#f0a41c]" />
              <h4 className="font-bold text-[#0F0F0F]">Verified reviews</h4>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <strong className="text-4xl font-extrabold text-[#0F0F0F]">{averageRating.toFixed(1)}</strong>
              <span className="text-sm font-semibold text-gray-500">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
              {reviewCount === 0 ? <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-extrabold tracking-wider text-sky-700">NEW</span> : null}
            </div>
          </div>
          {verifiedReviews.length > 3 ? (
            <button type="button" onClick={() => setShowAllReviews(current => !current)} className="text-sm font-bold text-[#3F7838]">
              {showAllReviews ? 'Show recent' : 'View all'}
            </button>
          ) : null}
        </div>
        <div className="mt-4 space-y-2" aria-label="Rating distribution">
          {[5, 4, 3, 2, 1].map(stars => {
            const count = Math.max(0, Number(reviewDistribution[stars]) || 0);
            const percentage = reviewCount > 0 ? Math.min(100, (count / reviewCount) * 100) : 0;
            return (
              <div key={stars} className="grid grid-cols-[18px_1fr_34px] items-center gap-2 text-xs text-gray-500">
                <span>{stars}</span>
                <span className="h-2 overflow-hidden rounded-full bg-gray-100"><span className="block h-full rounded-full bg-[#f0a41c]" style={{ width: `${percentage}%` }} /></span>
                <span className="text-right">{count}</span>
              </div>
            );
          })}
        </div>
        {visibleReviews.length ? (
          <div className="mt-5 divide-y divide-gray-100">
            {visibleReviews.map(review => (
              <article key={review.id} className="py-4 first:pt-0" data-testid="verified-review">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm text-[#0F0F0F]">{review.maskedCustomerName || 'Verified customer'}</strong>
                  <span className="text-xs text-gray-400">{formatReviewDate(review.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm tracking-[0.08em] text-[#e08700]" aria-label={`${review.stars} out of 5 stars`}>{'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}</p>
                {review.text ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{review.text}</p> : <p className="mt-2 text-sm italic text-gray-400">Star rating only</p>}
                {review.reply?.text ? (
                  <div className="mt-3 rounded-xl bg-[#F1FBF3] p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#3F7838]">EasyGoSpa reply</p>
                    <p className="mt-1 text-sm leading-6 text-gray-700">{review.reply.text}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : <p className="mt-5 text-sm text-gray-600">No verified reviews yet.</p>}
      </section>
      {/* 底部账单条已拆(老板 2026-07-21):Book 按钮直接长在选中的服务卡里。 */}
    </div>
  );
}

export default function BookingModal() {
  const router = useRouter();
  const [bookingCatalog, setBookingCatalog] = useState(() => getFallbackWebsiteBookingCatalog());
  const [catalogStatus, setCatalogStatus] = useState('loading');
  const catalogStatusRef = useRef('loading');
  const catalogHydratedRef = useRef(false);
  const bookingOpenRef = useRef(false);
  // ?book=1 自动弹窗只允许触发一次:目录每 12 秒刷新会让所在的 effect 重跑,
  // 不加这道闸,客人每 12 秒被打回技师墙一次(2026-07-29 老板实测发现)。
  const bookDeepLinkHandledRef = useRef(false);
  // 技师墙上的手机号 → 折扣。老板 2026-07-29:进墙就问号码,拿到就全场显示折后价。
  const [wallPromoPhone, setWallPromoPhone] = useState('');
  const [promoCampaign, setPromoCampaign] = useState({ enabled: false, amount: 0 });
  const [promoState, setPromoState] = useState({ discount: 0, phone: '', loading: false, error: '' });
  const activeBookingInspectionSequenceRef = useRef(0);

  useEffect(() => {
    catalogStatusRef.current = catalogStatus;
  }, [catalogStatus]);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('wall');
  const [formData, setFormData] = useState(createInitialForm());
  const [emailDraft, setEmailDraft] = useState({ email: '', name: '', phone: '' });
  const [wallSearch, setWallSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState(allServiceAreasValue);
  const [matchSelectedService, setMatchSelectedService] = useState(false);
  // 老板 2026-07-19:墙顶部筛选——Nearby / Most booked(默认)/ Service type。
  const [wallSort, setWallSort] = useState('recommended');
  const [serviceTypeFilter, setServiceTypeFilter] = useState(ALL_SERVICE_TYPES_VALUE);
  const [pendingRestingTherapistId, setPendingRestingTherapistId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');
  // 「约稍后」(2026-07-29 老板拍板恢复):默认仍是"马上来",一步都没多。
  const [scheduleMode, setScheduleMode] = useState('asap');
  const [scheduleSlot, setScheduleSlot] = useState(null);
  const [availability, setAvailability] = useState({ status: 'idle', days: [], earliest: null });
  // 手动重拉计数:客人被"这个点刚被抢走"拦下时,得重新去后台拿一份真列表,
  // 光改状态不会触发重查(依赖项没变)。
  const [availabilityNonce, setAvailabilityNonce] = useState(0);
  // 墙级"约稍后"过滤(2026-07-30 老板拍板):客人先挑时间,墙只显示那个点能来的技师。
  const [wallTimeMatch, setWallTimeMatch] = useState({ status: 'idle', availableIds: [], requested: null });
  const [phoneError, setPhoneError] = useState('');
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_BOOKING_PHONE_COUNTRY);
  const [addressFeedback, setAddressFeedback] = useState('');
  const [customerCoords, setCustomerCoords] = useState(null);
  // 定位死锁修复(老板 2026-07-20 拍板通过):拒绝浏览器定位的客人从墙上补位置。
  const [showWallLocationPicker, setShowWallLocationPicker] = useState(false);
  const [activeBookingDialog, setActiveBookingDialog] = useState(null);
  const [activeCancelContact, setActiveCancelContact] = useState('');
  const [activeCancelConfirming, setActiveCancelConfirming] = useState(false);
  const [activeCancelPending, setActiveCancelPending] = useState(false);
  const [activeCancelError, setActiveCancelError] = useState('');
  const [couponOptOut, setCouponOptOut] = useState(false);
  const [couponPreviewState, setCouponPreviewState] = useState('idle');
  const [couponPreview, setCouponPreview] = useState(null);
  const couponPreviewSequenceRef = useRef(0);
  const addressFieldRef = useRef(null);
  const addressFeedbackTimerRef = useRef(null);
  const modalScrollRef = useRef(null); // 老板 2026-07-24:进详情页要滚回顶部,别停在价格中间

  const catalogServices = Array.isArray(bookingCatalog.services) ? bookingCatalog.services : [];
  const catalogTherapists = Array.isArray(bookingCatalog.therapists) ? bookingCatalog.therapists : [];
  const specificTherapists = useMemo(() => concreteTherapistsForWall('', catalogTherapists), [catalogTherapists]);
  const hasSpecificTherapists = specificTherapists.length > 0;
  const catalogUnavailable = catalogStatus === 'empty' || (catalogStatus === 'ready' && !hasSpecificTherapists);
  const safeFallbackTherapist = useMemo(() => (
    catalogTherapists.find(therapist => therapist.id === 'any_available')
    || getFallbackWebsiteBookingCatalog('specific_therapist_unavailable').therapists.find(therapist => therapist.id === 'any_available')
    || null
  ), [catalogTherapists]);
  const bookingTherapists = useMemo(() => (
    safeFallbackTherapist && !catalogTherapists.some(therapist => therapist.id === 'any_available')
      ? [...catalogTherapists, safeFallbackTherapist]
      : catalogTherapists
  ), [catalogTherapists, safeFallbackTherapist]);
  // 2026-07-11 老板拍板:下单必选具体技师,"任意技师"入口已移除;
  // safeFallbackTherapist 仅保留给历史链接兜底解析,不再作为可选项展示。
  const selectedTherapist = useMemo(() => findWebsiteTherapist(formData.requestedTechnicianId, bookingTherapists), [bookingTherapists, formData.requestedTechnicianId]);
  const serviceFilterName = formData.preferredService || formData.service;
  const serviceTypeOptions = useMemo(() => serviceTypeOptionsForWall(catalogTherapists), [catalogTherapists]);
  const wallTherapists = useMemo(() => filterTherapistsForWall({
    therapists: catalogTherapists,
    query: wallSearch,
    selectedArea,
    allAreasValue: allServiceAreasValue,
    selectedService: serviceFilterName,
    matchSelectedService,
    serviceType: serviceTypeFilter,
    sortBy: wallSort
  }), [catalogTherapists, matchSelectedService, selectedArea, serviceFilterName, serviceTypeFilter, wallSearch, wallSort]);
  // 「约稍后」选了时间且后台已回话 → 墙上只留那个点能来的技师;其余情形保持全名单。
  const wallTherapistsForTime = useMemo(() => {
    if (scheduleMode !== 'scheduled' || wallTimeMatch.status !== 'ready') return wallTherapists;
    const availableIds = new Set(wallTimeMatch.availableIds);
    return wallTherapists.filter(therapist => availableIds.has(String(therapist.id)));
  }, [scheduleMode, wallTherapists, wallTimeMatch]);
  // 服务列表按默认档(60 分钟)价格从低到高排(老板 2026-07-21:最便宜的放最前面)。
  const availableServices = useMemo(() => {
    const list = servicesForTherapist(formData.requestedTechnicianId || 'any_available', bookingTherapists, catalogServices);
    return [...list].sort((a, b) => (Number(defaultDurationOption(a)?.price) || Infinity) - (Number(defaultDurationOption(b)?.price) || Infinity));
  }, [bookingTherapists, catalogServices, formData.requestedTechnicianId]);
  const selectedService = useMemo(() => findBookingServiceByName(formData.service, catalogServices), [catalogServices, formData.service]);
  const selectedDuration = useMemo(() => selectedService ? findExactDurationOption(selectedService, formData.durationMinutes) : null, [selectedService, formData.durationMinutes]);
  const selectedServiceOption = useMemo(() => resolveSelectedServiceOption(formData, catalogServices), [catalogServices, formData]);
  const selectedTotalAmount = selectedServiceOption?.price ?? 0;
  // 「约稍后」的时间表只能来自后台——后台知道她排了哪些班、手上有哪些单、
  // 这个时长塞不塞得下。前端自己造一份 00:00–23:30 的列表,就是 7/16 之前那个
  // "客人能约一个没人上班的凌晨三点"的老毛病。
  const scheduleTherapistAccountId = selectedTherapist?.id === 'any_available' ? '' : (selectedTherapist?.id || '');
  const scheduleDurationMinutes = selectedServiceOption?.durationMinutes || 0;
  useEffect(() => {
    if (scheduleMode !== 'scheduled' || !scheduleTherapistAccountId || !scheduleDurationMinutes) return undefined;
    let active = true;
    setAvailability(current => ({ ...current, status: 'loading' }));
    (async () => {
      try {
        const query = `therapistId=${encodeURIComponent(scheduleTherapistAccountId)}&durationMinutes=${encodeURIComponent(scheduleDurationMinutes)}`;
        const response = await fetch(apiUrl(`/api/booking-availability?${query}`), { cache: 'no-store' });
        const payload = await response.json().catch(() => null);
        if (!active) return;
        if (!response.ok || !payload?.ok) {
          setAvailability({ status: 'failed', days: [], earliest: null });
          return;
        }
        setAvailability({
          status: 'ready',
          days: Array.isArray(payload.days) ? payload.days.filter(day => Array.isArray(day.times) && day.times.length) : [],
          earliest: payload.earliest || null
        });
      } catch {
        if (active) setAvailability({ status: 'failed', days: [], earliest: null });
      }
    })();
    return () => { active = false; };
  }, [scheduleMode, scheduleTherapistAccountId, scheduleDurationMinutes, availabilityNonce]);

  // A slot only survives while it is still on the freshly loaded list.
  useEffect(() => {
    if (availability.status !== 'ready' || !scheduleSlot?.time) return;
    const stillOpen = availability.days.some(day => day.date === scheduleSlot.date && day.times.includes(scheduleSlot.time));
    if (!stillOpen) setScheduleSlot(null);
  }, [availability, scheduleSlot]);

  // 墙级时间过滤:选了"约稍后 + 具体时间"就问后台"这个点谁能来",墙上只留能来的。
  // 查询失败不装作"全都能来"也不清空墙——保留全名单并明说没核到,后端下单时还有档期硬校验兜底。
  const wallSlotDate = scheduleMode === 'scheduled' ? (scheduleSlot?.date || '') : '';
  const wallSlotTime = scheduleMode === 'scheduled' ? (scheduleSlot?.time || '') : '';
  useEffect(() => {
    if (!wallSlotDate || !wallSlotTime) {
      setWallTimeMatch({ status: 'idle', availableIds: [], requested: null });
      return undefined;
    }
    let active = true;
    setWallTimeMatch(current => ({ ...current, status: 'loading', requested: { date: wallSlotDate, time: wallSlotTime } }));
    (async () => {
      try {
        const query = `date=${encodeURIComponent(wallSlotDate)}&time=${encodeURIComponent(wallSlotTime)}&durationMinutes=${WALL_TIME_MATCH_DURATION_MINUTES}`;
        const response = await fetch(apiUrl(`/api/booking-availability?${query}`), { cache: 'no-store' });
        const payload = await response.json().catch(() => null);
        if (!active) return;
        if (!response.ok || !payload?.ok) {
          setWallTimeMatch({ status: 'failed', availableIds: [], requested: { date: wallSlotDate, time: wallSlotTime } });
          return;
        }
        setWallTimeMatch({
          status: 'ready',
          availableIds: (Array.isArray(payload.available) ? payload.available : []).map(item => String(item?.therapistId || '')).filter(Boolean),
          requested: { date: wallSlotDate, time: wallSlotTime }
        });
      } catch {
        if (active) setWallTimeMatch({ status: 'failed', availableIds: [], requested: { date: wallSlotDate, time: wallSlotTime } });
      }
    })();
    return () => { active = false; };
  }, [wallSlotDate, wallSlotTime]);

  useEffect(() => {
    let active = true;
    async function loadBookingCatalog() {
      // 整页刷新后:60 秒内的上次名单先上墙,本次拉取转为背后静默刷新。
      if (!catalogHydratedRef.current) {
        catalogHydratedRef.current = true;
        const cached = readCatalogSessionCache();
        if (cached) {
          setBookingCatalog(cached);
          setCatalogStatus('ready');
          catalogStatusRef.current = 'ready';
        }
      }
      // 墙上已有名单(定位到达的补距离刷新、缓存命中)就保持显示,不再闪回 Loading。
      const hasWall = catalogStatusRef.current === 'ready';
      if (!hasWall) setCatalogStatus('loading');
      try {
        const catalogCoords = isUsableCustomerLocation(customerCoords) ? customerCoords : null;
        const catalogUrl = catalogCoords
          ? apiUrl(`/api/booking-catalog?lat=${encodeURIComponent(catalogCoords.latitude)}&lng=${encodeURIComponent(catalogCoords.longitude)}`)
          : apiUrl('/api/booking-catalog');
        const response = await fetch(catalogUrl, { cache: 'no-store' });
        const payload = await response.json().catch(() => null);
        if (!active || !response.ok || payload?.ok !== true) throw new Error('BOOKING_CATALOG_LOAD_FAILED');
        if (payload.fallback) {
          // 静默刷新撞上兜底名单:保住墙上的真名单,不用假名单顶掉。
          if (catalogStatusRef.current === 'ready') return;
          setBookingCatalog(payload);
          setCatalogStatus('error');
          return;
        }
        setBookingCatalog(payload);
        const payloadServices = Array.isArray(payload.services) ? payload.services : [];
        const payloadTherapists = Array.isArray(payload.therapists) ? payload.therapists.filter(therapist => therapist.id !== 'any_available') : [];
        const nextStatus = payloadServices.length && payloadTherapists.length ? 'ready' : 'empty';
        if (nextStatus === 'ready') writeCatalogSessionCache(payload);
        setCatalogStatus(nextStatus);
      } catch {
        if (!active) return;
        // 静默刷新失败同样保住墙上的名单;只有首拉失败才亮错误卡。
        if (catalogStatusRef.current === 'ready') return;
        setBookingCatalog(getFallbackWebsiteBookingCatalog('website_catalog_proxy_unavailable'));
        setCatalogStatus('error');
      }
    }
    loadBookingCatalog();
    // 老板 2026-07-18:技师墙开着也要实时反映技师端动态(接单→最早可约往后跳,
    // 完成/退单→往前跳)。每 12 秒静默重拉,只在弹窗打开且页面可见时跑,不闪
    // Loading、不顶掉已选技师。
    const liveTimer = window.setInterval(() => {
      if (bookingOpenRef.current && document.visibilityState === 'visible') loadBookingCatalog();
    }, 12000);
    const onVisible = () => {
      if (bookingOpenRef.current && document.visibilityState === 'visible') loadBookingCatalog();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      window.clearInterval(liveTimer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [customerCoords]);

  useEffect(() => {
    bookingOpenRef.current = isOpen;
  }, [isOpen]);

  // 弹窗一开就问后台"现在有没有活动、减多少"(金额不写死在前端,后台改了这里跟着变)。
  // 顺便:如果客人之前在 /welcome 领过券,直接把号码和折扣带进来,不用再填一次。
  useEffect(() => {
    if (!isOpen || promoCampaign.enabled) return;
    let alive = true;
    (async () => {
      try {
        const saved = readPromoClaimPhone();
        const query = saved ? `?phone=${encodeURIComponent(saved)}` : '';
        const payload = await fetch(`/api/promo-claim${query}`, { cache: 'no-store' }).then(r => r.json());
        if (!alive || payload?.enabled !== true) return;
        setPromoCampaign({ enabled: true, amount: Number(payload.amount) || 0 });
        if (payload.coupon?.amount > 0 && saved) {
          setPromoState({ discount: Number(payload.coupon.amount), phone: saved, loading: false, error: '' });
          setWallPromoPhone(saved);
        }
      } catch { /* 活动查不到就当没有,绝不挡住下单 */ }
    })();
    return () => { alive = false; };
  }, [isOpen, promoCampaign.enabled]);

  const submitWallPromoPhone = async event => {
    event.preventDefault();
    const digits = wallPromoPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setPromoState(current => ({ ...current, error: 'Please enter your mobile number.' }));
      return;
    }
    setPromoState(current => ({ ...current, loading: true, error: '' }));
    try {
      const payload = await fetch('/api/promo-claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone: digits })
      }).then(r => r.json());
      const amount = Number(payload?.coupon?.amount) || 0;
      if (!payload?.ok || amount <= 0) {
        // 已经用过券的老客人也走这里 —— 不报错,只是没有折扣,别让他觉得系统坏了
        setPromoState({ discount: 0, phone: digits, loading: false, error: 'No first-booking discount on this number.' });
        return;
      }
      setPromoState({ discount: amount, phone: digits, loading: false, error: '' });
      // 号码带进下单表单,客人不用再填一遍
      const local = digits.startsWith('63') ? digits.slice(2) : digits.replace(/^0/, '');
      setEmailDraft(current => ({ ...current, phone: local }));
      setFormData(current => ({ ...current, phone: local }));
    } catch {
      setPromoState(current => ({ ...current, loading: false, error: 'Could not apply. Please try again.' }));
    }
  };


  useEffect(() => () => {
    if (addressFeedbackTimerRef.current) window.clearTimeout(addressFeedbackTimerRef.current);
  }, []);

  // 打开弹窗时轻声定位一次:拿到坐标 → 技师列表按距离显示,并预填下单定位。
  // 客人拒绝或不支持时静默跳过,一切照常。
  useEffect(() => {
    if (!isOpen || customerCoords || typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      position => {
        const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        if (!isUsableCustomerLocation(coords)) return;
        setCustomerCoords(coords);
        setFormData(current => (current.customerLocation ? current : { ...current, customerLocation: coords }));
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, [isOpen, customerCoords]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('booking-modal-open');
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('booking-modal-open');
    };
  }, [isOpen]);

  const showActiveBookingDialog = useCallback((reference, { contactHint = '', cancelToken = '', persisted = true, notice = '' } = {}) => {
    if (!isActiveBookingReference(reference)) return false;
    activeBookingInspectionSequenceRef.current += 1;
    const stored = readStoredSession();
    setActiveBookingDialog({ reference, cancelToken, persisted, notice });
    setActiveCancelContact(String(contactHint || stored?.customerEmail || stored?.phone || '').trim());
    setActiveCancelConfirming(false);
    setActiveCancelPending(false);
    setActiveCancelError('');
    return true;
  }, []);

  const inspectStoredActiveBooking = useCallback(async () => {
    const inspectionSequence = ++activeBookingInspectionSequenceRef.current;
    const marker = await resolveActiveBookingGate({
      isCurrent: () => inspectionSequence === activeBookingInspectionSequenceRef.current,
      loadStatus: async reference => {
        const response = await fetch(apiUrl(`/api/booking-status?ref=${encodeURIComponent(reference)}`), { cache: 'no-store' });
        if (!response.ok) return null;
        return response.json().catch(() => null);
      }
    });
    if (inspectionSequence !== activeBookingInspectionSequenceRef.current) return;
    if (!marker) {
      setActiveBookingDialog(null);
      return;
    }
    showActiveBookingDialog(marker.reference, { cancelToken: marker.cancelToken });
  }, [showActiveBookingDialog]);

  useEffect(() => {
    const openModal = event => {
      const serviceName = serviceToCatalogName(event?.detail?.service);
      const stored = readStoredSession();
      const storedPhone = normalizeBookingPhoneInput(stored?.phone || '', DEFAULT_BOOKING_PHONE_COUNTRY);
      setError('');
      setDateError('');
      setPhoneError('');
      setPhoneCountry(storedPhone.countryIso);
      setAddressFeedback('');
      setWallSearch('');
      setSelectedArea(allServiceAreasValue);
      setMatchSelectedService(false);
      setWallSort('recommended');
      setServiceTypeFilter(ALL_SERVICE_TYPES_VALUE);
      setPendingRestingTherapistId('');
      setIsSubmitting(false);
      setActiveBookingDialog(null);
      setActiveCancelConfirming(false);
      setActiveCancelError('');
      couponPreviewSequenceRef.current += 1;
      setCouponOptOut(false);
      setCouponPreviewState('idle');
      setCouponPreview(null);
      // ⚠ 2026-07-29:手机号原来只从"以前下过单"的记录预填。
      // 而刚从 /welcome 领完 ₱150 的**新客**没有那条记录,手机号那格是空的
      // ——券绑的是手机号,不填就永远匹配不上,客人以为券是假的。
      // 所以:没有历史记录时,用他领券时填的那个号码。
      const promoPhone = readPromoClaimPhone();
      setEmailDraft(stored
        ? { email: stored.customerEmail, name: stored.customerName || '', phone: stored.phone || '' }
        : { email: '', name: '', phone: promoPhone });
      setFormData(current => {
        const nextForm = createInitialForm(serviceName, catalogServices);
        return stored
          ? { ...nextForm, customerEmail: stored.customerEmail, customerName: stored.customerName || current.customerName, phone: storedPhone.localNumber || current.phone }
          : { ...nextForm, phone: promoPhone || nextForm.phone };
      });
      // 重开弹窗要回到"马上来":上一次挑的那个时间点早就过期了。
      setScheduleMode('asap');
      setScheduleSlot(null);
      setAvailability({ status: 'idle', days: [], earliest: null });
      setStep('wall');
      setIsOpen(true);
      void inspectStoredActiveBooking();
    };

    window.addEventListener('open-booking-modal', openModal);
    window.addEventListener('open-booking-modal-with-service', openModal);
    // 技师墙直达链接:带 ?book=1 进站直接弹预约墙(2026-07-28 老板拍板——
    // AI 客服/真人发给客人的标准链接,省掉"自己找 Book Now"那一步)
    // ⚠ 2026-07-29 修(老板实测发现):这个 effect 的依赖里有 catalogServices,
    // 而技师墙每 12 秒静默重拉一次目录 —— 目录一换,这段就重跑,openModal() 里的
    // setStep('wall') 把正在看技师详情/正在填表的客人**直接打回技师墙**,每 12 秒一次,
    // 根本走不完下单。而 ?book=1 正是广告和 AI 客服发出去的那个链接,所有从广告
    // 进来的人全中招。
    // 改法:整个页面生命周期内只自动弹一次。
    if (typeof window !== 'undefined'
      && !bookDeepLinkHandledRef.current
      && new URLSearchParams(window.location.search).get('book')) {
      bookDeepLinkHandledRef.current = true;
      openModal();
    }
    return () => {
      window.removeEventListener('open-booking-modal', openModal);
      window.removeEventListener('open-booking-modal-with-service', openModal);
    };
  }, [catalogServices, inspectStoredActiveBooking]);

  const updateField = (field, value) => {
    setFormData(current => ({ ...current, [field]: value }));
    if (error) setError('');
  };

  const updateCustomerLocation = location => {
    setFormData(current => ({
      ...current,
      customerLocation: isUsableCustomerLocation(location)
        ? { latitude: location.latitude, longitude: location.longitude }
        : null
    }));
    if (error) setError('');
  };

  const handleResolvedAddress = useCallback((address, source, outcome = {}) => {
    const failed = outcome.geocodeFailed === true || !String(address || '').trim();
    setFormData(current => ({
      ...current,
      addressNote: resolvedAddressAfterConfirmation(current.addressNote, address)
    }));
    setAddressFeedback(failed ? 'error' : 'success');
    if (addressFeedbackTimerRef.current) window.clearTimeout(addressFeedbackTimerRef.current);
    addressFeedbackTimerRef.current = window.setTimeout(() => setAddressFeedback(''), 1200);
    window.requestAnimationFrame(() => {
      addressFieldRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  const handleWallLocationChange = location => {
    if (!isUsableCustomerLocation(location)) return;
    const coords = { latitude: location.latitude, longitude: location.longitude };
    setCustomerCoords(coords);
    updateCustomerLocation(coords);
    // 老板 2026-07-24:确认定位后自动收起大地图,别霸屏挡技师。
    setShowWallLocationPicker(false);
  };

  const handlePhoneChange = value => {
    const normalized = normalizeBookingPhoneInput(value, phoneCountry);
    setPhoneCountry(normalized.countryIso);
    updateField('phone', normalized.localNumber);
    if (phoneError) setPhoneError('');
  };

  const validatePhoneField = () => {
    const valid = isValidBookingPhone(phoneCountry, formData.phone);
    setPhoneError(valid ? '' : phoneErrorMessage);
    return valid;
  };

  const handlePreferredDateChange = value => {
    const today = manilaToday();
    const preferredDate = value && value < today ? today : value;
    setDateError(value && value < today ? 'Please pick today or a future date.' : '');
    setFormData(current => ({
      ...current,
      preferredDate,
      preferredTime: isSelectableManilaTime(preferredDate, current.preferredTime) ? current.preferredTime : ''
    }));
    if (error) setError('');
  };

  const enterTherapistDetail = therapist => {
    setFormData(current => {
      const therapistServices = servicesForTherapist(therapist.id, bookingTherapists, catalogServices);
      const currentService = findBookingServiceByName(current.service, catalogServices);
      const selectedServiceAllowed = currentService && therapistServices.some(service => service.id === currentService.id);
      const selectedOption = selectedServiceAllowed ? findExactDurationOption(currentService, current.durationMinutes) : null;
      // 不预选服务(老板 2026-07-21 二改:卡片上有价就够了,客人点了哪个服务,
      // 底部账单条才弹出来 —— 一直杵着挡内容)。
      return {
        ...current,
        requestedTechnicianId: therapist.id,
        serviceId: selectedServiceAllowed ? currentService.id : '',
        service: selectedServiceAllowed ? currentService.name : '',
        durationMinutes: selectedOption?.durationMinutes || '',
        totalAmount: selectedOption?.price || 0
      };
    });
    // 换了技师,上一个技师的空档一律作废——别让客人带着 Ana 的 22:30 去约 Mia。
    setScheduleSlot(null);
    setAvailability({ status: 'idle', days: [], earliest: null });
    setError('');
    setStep('detail');
    // 漏斗眼睛(2026-07-28:169 进站 0 单,死在哪一步没人知道)——看了技师详情
    trackMetaEvent('ViewContent');
  };

  // 老板 2026-07-24:进详情页时滚回顶部——之前从列表滚下去点技师,详情会停在中间(价格)。
  useEffect(() => {
    if (step === 'detail') modalScrollRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const openTherapistDetail = therapistId => {
    const therapist = findWebsiteTherapist(therapistId, bookingTherapists);
    if (!therapist) {
      setError('Current service profiles are temporarily unavailable. Please try again later.');
      return;
    }
    if (therapist.onShift !== true) {
      setPendingRestingTherapistId(therapist.id);
      return;
    }
    enterTherapistDetail(therapist);
  };

  const cancelRestingTherapistSelection = () => {
    setPendingRestingTherapistId('');
  };

  const continueRestingTherapistSelection = () => {
    const therapist = findWebsiteTherapist(pendingRestingTherapistId, bookingTherapists);
    setPendingRestingTherapistId('');
    if (!therapist) {
      setError('Current service profiles are temporarily unavailable. Please try again later.');
      return;
    }
    enterTherapistDetail(therapist);
  };

  const handleSelectService = service => {
    // 点服务即默认选中 60 分钟档(或最短档),价格立即出现在底部总计,不再等第二步。
    const option = defaultDurationOption(service);
    setFormData(current => current.serviceId === service.id
      ? current
      : { ...current, serviceId: service.id, service: service.name, durationMinutes: option?.durationMinutes || '', totalAmount: option?.price || 0 });
    if (error) setError('');
  };

  const handleSelectDuration = (service, option) => {
    setFormData(current => ({ ...current, serviceId: service.id, service: service.name, durationMinutes: option.durationMinutes, totalAmount: option.price }));
    if (error) setError('');
  };

  const handleBookSelection = () => {
    if (!selectedServiceOption) return;
    setError('');
    setStep('email');
    // 漏斗眼睛——选好服务,进入邮箱步
    trackMetaEvent('AddToCart');
  };

  const handleEmailContinue = event => {
    event.preventDefault();
    const session = getDefaultBookingSession(emailDraft);
    const sessionPhone = normalizeBookingPhoneInput(session.phone, phoneCountry);
    const normalizedSession = {
      ...session,
      phone: session.phone ? formatBookingPhoneE164(sessionPhone.countryIso, sessionPhone.localNumber) : ''
    };
    if (!isValidEmail(session.customerEmail)) {
      setError('Please enter a valid email address to continue.');
      return;
    }
    if (session.phone && !isValidBookingPhone(sessionPhone.countryIso, sessionPhone.localNumber)) {
      setError('Please enter a valid WhatsApp or phone number.');
      return;
    }
    saveStoredSession(normalizedSession);
    setPhoneCountry(sessionPhone.countryIso);
    setFormData(current => ({ ...current, customerEmail: session.customerEmail, customerName: session.customerName || current.customerName, phone: sessionPhone.localNumber || current.phone }));
    setError('');
    setStep('details');
  };

  const validateDetails = () => {
    if (!selectedTherapist) return 'Current service profiles are temporarily unavailable. Please try again later.';
    if (!formData.service || !selectedServiceOption) return 'Please select a valid service duration and price before continuing.';
    if (!isValidEmail(formData.customerEmail)) return 'Please continue with a valid email first.';
    if (!formData.customerName.trim()) return 'Please enter your full name.';
    if (!formData.phone.trim()) {
      setPhoneError(phoneErrorMessage);
      return 'Please enter your WhatsApp or phone number.';
    }
    if (!isValidBookingPhone(phoneCountry, formData.phone)) {
      setPhoneError(phoneErrorMessage);
      return phoneErrorMessage;
    }
    setPhoneError('');
    // Area is still auto-derived from the address. The schedule is auto-stamped for
    // "as soon as possible" and explicitly chosen for "book for later".
    if (scheduleMode === 'scheduled' && !scheduleSlot?.time) {
      return availability.status === 'ready' && !availability.days.length
        ? 'She has no open times in the next three days — please choose "As soon as possible" or another therapist.'
        : 'Please pick a time for your booking.';
    }
    if (!formData.addressNote.trim()) return 'Please enter your building, condo, hotel, or exact address details.';
    return null;
  };

  const buildBookingRequestPayload = ({ previewOnly = false, skipCoupon = couponOptOut } = {}) => {
    const selectedOption = selectedServiceOption;
    if (!selectedOption || !selectedTherapist) return null;
    const selectedServices = [{
      serviceId: selectedOption.service.id,
      serviceName: selectedOption.service.name,
      durationMinutes: selectedOption.durationMinutes,
      price: selectedOption.price,
      currency: selectedOption.currency || bookingCatalog.currency || 'PHP'
    }];
    // "Book for later" sends the customer's own choice and tells the backend to
    // honour it. "As soon as possible" keeps stamping now + lead buffer, which the
    // backend is still free to slide to the therapist's real earliest slot.
    const bookingIsScheduled = scheduleMode === 'scheduled' && Boolean(scheduleSlot?.date && scheduleSlot?.time);
    const dispatchDate = bookingIsScheduled ? scheduleSlot.date : manilaToday();
    const dispatchTime = bookingIsScheduled ? scheduleSlot.time : manilaAsapTime();
    const derivedArea = inferAreaFromAddress(formData.addressNote);
    const couponExpectation = !previewOnly && couponPreviewState === 'ready' && couponPreview
      ? {
          expectedCouponApplied: couponPreview.couponApplied === true,
          expectedGrossServiceAmount: couponPreview.grossServiceAmount,
          expectedCashToCollect: couponPreview.cashToCollect
        }
      : {};

    return {
      source: 'website',
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      phone: formatBookingPhoneE164(phoneCountry, formData.phone),
      requestedTechnicianId: selectedTherapist.id,
      requestedTechnicianName: selectedTherapist.name,
      requestedTechnicianProfileId: selectedTherapist.profileId || selectedTherapist.id,
      requestedTechnicianProfileName: selectedTherapist.profileName || selectedTherapist.name,
      requestedTechnicianAccountId: selectedTherapist.id === 'any_available' ? '' : (selectedTherapist.technicianAccountId || ''),
      requestedTechnicianAccountName: selectedTherapist.id === 'any_available' ? '' : (selectedTherapist.technicianAccountName || ''),
      therapistPreference: selectedTherapist.id === 'any_available' ? 'any_available' : 'specific_therapist',
      therapistGenderPreference: selectedTherapist.therapistPreference === 'female_preferred' ? 'female' : selectedTherapist.therapistPreference === 'male_preferred' ? 'male' : '',
      selectedTherapistSpecialties: selectedTherapist.specialties,
      selectedServices,
      serviceId: selectedOption.service.id,
      service: selectedOption.service.name,
      durationMinutes: selectedOption.durationMinutes,
      totalAmount: selectedOption.price,
      currency: selectedOption.currency || bookingCatalog.currency || 'PHP',
      preferredDate: dispatchDate,
      preferredTime: dispatchTime,
      scheduleMode: bookingIsScheduled ? 'scheduled' : 'asap',
      area: derivedArea,
      addressNote: formData.addressNote,
      ...(isUsableCustomerLocation(formData.customerLocation) ? {
        customerLocation: {
          latitude: formData.customerLocation.latitude,
          longitude: formData.customerLocation.longitude
        }
      } : {}),
      peopleCount: 1,
      paymentMethod: 'cash_after_service',
      paymentStatus: 'pending_collection',
      paymentTiming: 'after_service',
      skipCoupon: skipCoupon === true,
      previewOnly: previewOnly === true,
      ...couponExpectation,
      notes: formData.notes,
      metadata: {
        website: 'www.easygospa.com',
        form: 'BookingModal',
        submittedFrom: 'public_website',
        bookingFlow: 'therapist_wall_detail_service_cash',
        catalogSource: bookingCatalog.catalogSource || 'catalog_unavailable_safe_fallback',
        requestedTechnicianProfileId: selectedTherapist.profileId || selectedTherapist.id,
        requestedTechnicianProfileName: selectedTherapist.profileName || selectedTherapist.name,
        serviceId: selectedOption.service.id,
        ...(selectedTherapist.id !== 'any_available' && selectedTherapist.technicianAccountId ? { requestedTechnicianAccountId: selectedTherapist.technicianAccountId } : {}),
        ...(selectedTherapist.id !== 'any_available' && selectedTherapist.technicianAccountName ? { requestedTechnicianAccountName: selectedTherapist.technicianAccountName } : {}),
        // 这单从哪来(2026-07-28 归因链):进站抓到的 fbclid/utm 原样随单带走,
        // 后台才算得清"广告到底带来几单",不再靠猜。
        ...adAttributionMetadata()
      }
    };
  };

  const requestCouponPreview = async (skipCoupon = false) => {
    const sequence = ++couponPreviewSequenceRef.current;
    const previewPayload = buildBookingRequestPayload({ previewOnly: true, skipCoupon });
    setCouponPreview(null);
    setCouponPreviewState('loading');
    if (!previewPayload) {
      setCouponPreviewState('error');
      return;
    }
    try {
      const authorizationHeaders = await customerAuthorizationHeaders();
      const response = await fetch(apiUrl('/api/booking-request'), {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authorizationHeaders },
        body: JSON.stringify(previewPayload)
      });
      const payload = await response.json().catch(() => null);
      if (sequence !== couponPreviewSequenceRef.current) return;
      if (!response.ok || payload?.ok !== true || payload?.preview !== true) {
        throw new Error(payload?.error || 'Coupon availability could not be confirmed.');
      }
      setCouponPreview(payload);
      setCouponPreviewState('ready');
    } catch {
      if (sequence !== couponPreviewSequenceRef.current) return;
      setCouponPreview(null);
      setCouponPreviewState('error');
    }
  };

  const goBack = () => {
    setError('');
    if (step === 'detail') setStep('wall');
    else if (step === 'email') setStep('detail');
    else if (step === 'details') setStep('email');
    else if (step === 'confirm') {
      couponPreviewSequenceRef.current += 1;
      setCouponPreviewState('idle');
      setCouponPreview(null);
      setStep('details');
    }
  };

  const handleDetailsContinue = event => {
    event.preventDefault();
    const validationError = validateDetails();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setCouponOptOut(false);
    setCouponPreview(null);
    setStep('confirm');
    // 漏斗眼睛——资料填完,到了最后确认页
    trackMetaEvent('InitiateCheckout');
    void requestCouponPreview(false);
  };

  const handleActiveBookingCancellation = async event => {
    event.preventDefault();
    if (!activeBookingDialog || activeCancelPending) return;
    if (!activeCancelConfirming) {
      setActiveCancelConfirming(true);
      setActiveCancelError('');
      return;
    }
    if (!activeCancelContact.trim()) {
      setActiveCancelError('Enter the booking email or phone to continue.');
      return;
    }
    setActiveCancelPending(true);
    setActiveCancelError('');
    const result = await cancelPublicBooking({
      reference: activeBookingDialog.reference,
      contact: activeCancelContact,
      cancelToken: activeBookingDialog.cancelToken
    });
    setActiveCancelPending(false);
    if (result.ok) {
      clearActiveBooking({ reference: activeBookingDialog.reference });
      setActiveBookingDialog(null);
      setActiveCancelConfirming(false);
      setActiveCancelContact('');
      return;
    }
    if (result.httpStatus === 404) {
      setActiveCancelError("We couldn't verify that booking with those details.");
      return;
    }
    setActiveCancelError(result.error || 'Booking cancellation is temporarily unavailable. Please try again.');
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const validationError = validateDetails();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (couponPreviewState !== 'ready') {
      setError('Please wait while we confirm your coupon and cash total.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const requestPayload = buildBookingRequestPayload({ skipCoupon: couponOptOut });
    if (!requestPayload) {
      setIsSubmitting(false);
      setError('Please select a valid service duration and price before submitting.');
      return;
    }

    try {
      const authorizationHeaders = await customerAuthorizationHeaders();
      // 提交紧贴网络请求再校验一次:缺坐标、距离未知、或 >10 km 都不会调用 fetch。
      const guardedSubmission = await submitBookingWithinServiceRadius({
        therapist: selectedTherapist,
        customerLocation: formData.customerLocation,
        submit: () => fetch(apiUrl('/api/booking-request'), {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...authorizationHeaders },
          body: JSON.stringify(requestPayload)
        })
      });
      if (!guardedSubmission.ok) throw new Error(guardedSubmission.error);
      const response = guardedSubmission.response;
      const payload = await response.json().catch(() => null);
      if (
        payload?.created === true
        && payload?.code === 'BOOKING_CREATED_RECONCILE_PENDING'
      ) {
        const recoveryReference = String(payload.reference || '').trim();
        if (
          /^mbr-brand-a-[a-z0-9]+$/i.test(recoveryReference)
          && isPublicBookingCancelToken(payload.cancelToken)
        ) {
          const recoveryMarker = writeActiveBooking(recoveryReference, { cancelToken: payload.cancelToken });
          setError(payload.error || 'Your booking was received, but its schedule needs assistance. Do not submit again; contact us on WhatsApp.');
          showActiveBookingDialog(recoveryReference, {
            contactHint: formData.customerEmail || formData.phone,
            cancelToken: payload.cancelToken,
            persisted: Boolean(recoveryMarker),
            notice: payload.error
          });
          return;
        }
      }
      if (
        response.status === 409
        && (payload?.code === 'COUPON_PREVIEW_CHANGED' || payload?.code === 'COUPON_PREVIEW_REQUIRED')
      ) {
        setError('Your coupon or cash total changed. Please review the refreshed amount before submitting again.');
        setCouponPreview(null);
        setCouponPreviewState('loading');
        await requestCouponPreview(couponOptOut);
        return;
      }
      if (
        response.status === 409
        && payload?.code === 'ACTIVE_BOOKING_EXISTS'
      ) {
        setError('A booking already exists for these details. Log in to My Orders to view it or contact us on WhatsApp.');
        return;
      }
      // 老板 2026-07-29 定的规矩:她接不了这个点,就当面说清楚 + 给下一步,
      // 绝不能像以前那样悄悄把订单改成别的时间(客人页面写 22:30、技师 19:30 敲门)。
      if (response.status === 409 && payload?.code === 'SCHEDULED_SLOT_UNAVAILABLE') {
        const therapistName = selectedTherapist?.name || 'This therapist';
        const earliest = payload.earliestDate && payload.earliestTime
          ? formatScheduleLabel(payload.earliestDate, payload.earliestTime)
          : '';
        const wanted = scheduleSlot?.time ? formatScheduleLabel(scheduleSlot.date, scheduleSlot.time) : 'that time';
        setError(payload.reason === 'OFF_SHIFT'
          ? `${therapistName} is not working at ${wanted}.${earliest ? ` Her next opening is ${earliest}.` : ''} Pick another time below, or choose a therapist who is free then.`
          : `${therapistName} was just booked for ${wanted}.${earliest ? ` Her earliest is now ${earliest}.` : ''} Pick another time below, or choose a therapist who is free then.`);
        // Someone took the slot while this customer was typing — reload the real list.
        setScheduleSlot(null);
        setAvailabilityNonce(value => value + 1);
        setStep('details');
        return;
      }
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error || 'Booking request could not be submitted.');
      const reference = String(payload.reference || payload.bookingRequest?.id || '').trim();
      if (!/^mbr-brand-a-[a-z0-9]+$/i.test(reference)) {
        throw new Error('Booking request was not confirmed by the intake service. Please try again or contact us on WhatsApp.');
      }

      const activeBookingMarker = writeActiveBooking(reference, { cancelToken: payload.cancelToken });
      if (!activeBookingMarker) {
        setError('Your booking was created, but this browser could not save its cancellation credential. Keep this page open and contact us on WhatsApp if you need help.');
        showActiveBookingDialog(reference, {
          contactHint: formData.customerEmail || formData.phone,
          cancelToken: payload.cancelToken,
          persisted: false
        });
        return;
      }
      activeBookingInspectionSequenceRef.current += 1;
      trackMetaEvent('Schedule'); // 像素旁路:官网下单成功打一个信号给 Meta(没配像素时静默)
      setIsOpen(false);
      router.push(`/track/${encodeURIComponent(reference)}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Booking request could not be submitted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    activeBookingInspectionSequenceRef.current += 1;
    setIsOpen(false);
    setError('');
    setPendingRestingTherapistId('');
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={handleClose}>
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 32 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 32 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="flex h-[100dvh] max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-[#F6F7F5] shadow-2xl sm:h-auto sm:max-h-[94vh] sm:rounded-[2rem]" onClick={event => event.stopPropagation()}>
            {step === 'wall' ? (
              <div className="border-b border-gray-100 bg-white p-4 sm:p-5" data-testid="booking-wall-toolbar">
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={handleClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Close booking modal"><ArrowLeft className="h-5 w-5 text-gray-600" /></button>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-xl font-bold text-[#0F0F0F]">Choose therapist</h2>
                    <p className="mt-1 inline-flex max-w-full items-center gap-1 text-xs font-bold text-[#3F7838]" data-testid="therapist-area-label">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Serving within {MAX_SERVICE_DISTANCE_KM} km</span>
                    </p>
                  </div>
                  <button type="button" onClick={handleClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Close booking modal"><X className="h-5 w-5 text-gray-700" /></button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-2xl bg-gray-100 px-3">
                    <Search className="h-4 w-4 shrink-0 text-gray-400" />
                    <input value={wallSearch} onChange={event => setWallSearch(event.target.value)} className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-gray-500" placeholder="Search therapist..." />
                  </div>
                </div>
                {/* 老板 2026-07-20:删掉区域下拉——我们只服务 10km 内,按区域名筛选没意义还会误导;
                    Service type 顶上原来的位置,排序保留 Nearby / Most booked。 */}
                <div className="mt-2.5 flex flex-nowrap items-center gap-2 overflow-x-auto" data-testid="booking-wall-filters">
                  <label className="sr-only" htmlFor="therapist-servicetype-filter">Filter therapists by service type</label>
                  <select
                    id="therapist-servicetype-filter"
                    value={serviceTypeFilter}
                    onChange={event => setServiceTypeFilter(event.target.value)}
                    data-testid="therapist-servicetype-filter"
                    className="h-10 shrink-0 rounded-full border border-gray-200 bg-white px-3.5 text-sm font-bold text-gray-700 outline-none focus:border-[#4E8D43]"
                  >
                    <option value={ALL_SERVICE_TYPES_VALUE}>Service type</option>
                    {serviceTypeOptions.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <button type="button" onClick={() => setWallSort('nearby')} aria-pressed={wallSort === 'nearby'} data-testid="wall-sort-nearby" className={`h-10 shrink-0 rounded-full border px-3.5 text-sm font-bold ${wallSort === 'nearby' ? 'border-[#4E8D43] bg-[#4E8D43] text-white' : 'border-gray-200 bg-white text-gray-700'}`}>Nearby</button>
                  <button type="button" onClick={() => setWallSort('recommended')} aria-pressed={wallSort === 'recommended'} data-testid="wall-sort-popular" className={`h-10 shrink-0 rounded-full border px-3.5 text-sm font-bold ${wallSort === 'recommended' ? 'border-[#4E8D43] bg-[#4E8D43] text-white' : 'border-gray-200 bg-white text-gray-700'}`}>Most booked</button>
                </div>
              </div>
            ) : step !== 'detail' ? (
              <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <button type="button" onClick={goBack} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Back"><ArrowLeft className="h-5 w-5 text-gray-600" /></button>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-[#0F0F0F] sm:text-2xl">Book EasyGoSpa</h2>
                    <p className="text-sm text-gray-500">Enter your details to continue.</p>
                  </div>
                </div>
                <button type="button" onClick={handleClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Close booking modal"><X className="h-5 w-5 text-gray-600" /></button>
              </div>
            ) : null}

            <div ref={modalScrollRef} className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5" data-testid="booking-modal">

              {error ? <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

              {step === 'wall' ? (
                <div className="space-y-2">
                  {/* 2026-07-30 老板拍板:预约入口上墙,第一眼可见。默认仍是"马上来"零打扰;
                      选"约稍后"才展开时间条,选了时间就按排班过滤墙上的技师。 */}
                  <div className="mx-1 rounded-[1.5rem] border border-gray-200 bg-white p-3" data-testid="wall-schedule-bar">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setScheduleMode('asap'); setScheduleSlot(null); }}
                        aria-pressed={scheduleMode === 'asap'}
                        data-testid="wall-schedule-now"
                        className={`h-10 flex-1 rounded-full border text-sm font-bold transition ${scheduleMode === 'asap' ? 'border-[#4E8D43] bg-[#4E8D43] text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-[#4E8D43]'}`}
                      >⚡ Now</button>
                      <button
                        type="button"
                        onClick={() => setScheduleMode('scheduled')}
                        aria-pressed={scheduleMode === 'scheduled'}
                        data-testid="wall-schedule-later"
                        className={`h-10 flex-1 rounded-full border text-sm font-bold transition ${scheduleMode === 'scheduled' ? 'border-[#4E8D43] bg-[#4E8D43] text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-[#4E8D43]'}`}
                      >🕘 Book for later</button>
                    </div>
                    {scheduleMode === 'scheduled' ? (
                      <div className="mt-3 space-y-2" data-testid="wall-schedule-picker">
                        <div className="flex flex-wrap items-center gap-2">
                          {[0, 1, 2].map(offset => {
                            const dateKey = manilaDateKeyWithOffset(offset);
                            const active = (scheduleSlot?.date || manilaToday()) === dateKey;
                            return (
                              <button
                                key={dateKey}
                                type="button"
                                onClick={() => setScheduleSlot({ date: dateKey, time: '' })}
                                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${active ? 'border-[#4E8D43] bg-[#F1FBF3] text-[#3F7838]' : 'border-gray-300 bg-white text-gray-700 hover:border-[#4E8D43]'}`}
                              >{manilaDayLabel(dateKey, offset)}</button>
                            );
                          })}
                          <select
                            value={scheduleSlot?.time || ''}
                            onChange={event => setScheduleSlot({ date: scheduleSlot?.date || manilaToday(), time: event.target.value })}
                            data-testid="wall-schedule-time"
                            aria-label="Pick a time"
                            className="h-9 rounded-full border border-gray-300 bg-white px-3 text-sm font-bold text-gray-700 outline-none focus:border-[#4E8D43]"
                          >
                            <option value="">Pick a time…</option>
                            {timeSlots.filter(time => isSelectableManilaTime(scheduleSlot?.date || manilaToday(), time)).map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                        {!scheduleSlot?.time ? (
                          <p className="text-xs font-medium text-gray-500">Pick a day and time — we’ll show only the therapists free at that time.</p>
                        ) : wallTimeMatch.status === 'loading' ? (
                          <p className="text-xs font-medium text-gray-500">Checking who is free at {formatScheduleLabel(scheduleSlot.date, scheduleSlot.time)}…</p>
                        ) : wallTimeMatch.status === 'failed' ? (
                          <p className="text-xs font-semibold text-amber-700" data-testid="wall-schedule-check-failed">We could not verify schedules just now — showing everyone. Your time is re-checked when you book.</p>
                        ) : wallTimeMatch.status === 'ready' ? (
                          <p className="text-xs font-semibold text-[#3F7838]" data-testid="wall-schedule-match-note">Showing therapists free at {formatScheduleLabel(scheduleSlot.date, scheduleSlot.time)}.</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {/* ⚠ 2026-07-29 老板拍板:进技师墙就先要手机号,填完全场直接显示折后价。
                      原来要走到"填邮箱"那一步才知道减多少,客人从广告进来看到原价就走了。
                      号码在这里拿到之后:①当场查/发券 ②所有价格立刻变成折后价
                      ③下单表单自动带过去,不用再填一遍。 */}
                  {promoCampaign.enabled && !promoState.discount ? (
                    <form
                      className="mx-1 rounded-[1.5rem] border border-[#4E8D43]/30 bg-[#F1FBF3] p-4"
                      data-testid="wall-promo-phone"
                      onSubmit={submitWallPromoPhone}
                    >
                      <p className="text-sm font-bold text-[#0E6F1A]">
                        First booking? Get {money(promoCampaign.amount)} off
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-600">
                        Enter your mobile number to see your price. No transport fee, no tips.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <input
                          autoComplete="tel"
                          className="h-11 min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 font-medium text-[#0F0F0F] focus:border-[#4E8D43] focus:outline-none"
                          inputMode="tel"
                          onChange={event => setWallPromoPhone(event.target.value)}
                          placeholder="09XX XXX XXXX"
                          type="tel"
                          value={wallPromoPhone}
                        />
                        <button
                          className="h-11 shrink-0 rounded-xl bg-[#4E8D43] px-5 text-sm font-bold text-white disabled:opacity-60"
                          disabled={promoState.loading}
                          type="submit"
                        >
                          {promoState.loading ? '...' : 'Apply'}
                        </button>
                      </div>
                      {promoState.error ? <p className="mt-2 text-xs font-semibold text-[#B4463C]">{promoState.error}</p> : null}
                    </form>
                  ) : null}
                  {promoState.discount > 0 ? (
                    <div className="mx-1 flex items-center justify-between gap-3 rounded-full border border-[#4E8D43]/30 bg-[#F1FBF3] px-4 py-2" data-testid="wall-promo-applied">
                      <p className="truncate text-sm font-bold text-[#0E6F1A]">
                        {money(promoState.discount)} off applied — prices below are yours
                      </p>
                    </div>
                  ) : null}
                  {/* 老板 2026-07-24:定位确认后收成一条细条(大地图默认藏),别霸屏挡技师;
                      点"Adjust"才展开地图改 pin。未设定位时才给完整提示面板。 */}
                  {isUsableCustomerLocation(customerCoords) && !showWallLocationPicker ? (
                    <div className="mx-1 flex items-center justify-between gap-3 rounded-full border border-green-200 bg-green-50 px-4 py-2" data-testid="wall-location-entry">
                      <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold text-[#3F7838]"><MapPin className="h-4 w-4 shrink-0" />Location confirmed</p>
                      <button type="button" onClick={() => setShowWallLocationPicker(true)} data-testid="wall-location-entry-toggle" className="shrink-0 text-sm font-bold text-[#3F7838] underline underline-offset-2">Adjust</button>
                    </div>
                  ) : (
                    <div className="mx-1 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4" data-testid="wall-location-entry">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="min-w-0 flex-1 text-sm font-semibold text-amber-900">{isUsableCustomerLocation(customerCoords) ? 'Adjust your pin, then tap Confirm.' : 'Share your location to see nearby therapists.'}</p>
                        <button
                          type="button"
                          onClick={() => setShowWallLocationPicker(current => !current)}
                          data-testid="wall-location-entry-toggle"
                          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#4E8D43] px-4 text-sm font-bold text-white transition hover:bg-[#3F7838]"
                        >
                          <MapPin className="h-4 w-4" />{showWallLocationPicker ? 'Hide map' : 'Set location'}
                        </button>
                      </div>
                      {showWallLocationPicker ? (
                        <div className="mt-3" data-testid="wall-location-picker">
                          <LocationPicker value={formData.customerLocation} onChange={handleWallLocationChange} onAddress={handleResolvedAddress} />
                        </div>
                      ) : null}
                    </div>
                  )}
                  {catalogStatus === 'ready' ? <p className="px-1 text-sm font-semibold text-gray-600" data-testid="therapist-result-count">{wallTherapistsForTime.length} {wallTherapistsForTime.length === 1 ? 'therapist' : 'therapists'} available{scheduleMode === 'scheduled' && wallTimeMatch.status === 'ready' && wallTimeMatch.requested ? ` at ${formatScheduleLabel(wallTimeMatch.requested.date, wallTimeMatch.requested.time)}` : ''}</p> : null}
                  <div className="grid gap-3 px-1 pb-6 sm:grid-cols-2" data-testid="booking-therapist-list">
                    {catalogStatus === 'loading' ? (
                      <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 text-sm text-gray-700" data-testid="booking-catalog-loading">
                        <p className="font-bold text-[#0F0F0F]">Loading therapists…</p>
                        <p className="mt-1">Checking the current public booking catalog.</p>
                      </div>
                    ) : null}
                    {catalogStatus === 'ready' ? wallTherapistsForTime.map(therapist => <TherapistWallCard key={therapist.id} therapist={therapist} selected={formData.requestedTechnicianId === therapist.id} onSelect={openTherapistDetail} onRequireLocation={() => setShowWallLocationPicker(true)} customerLocated={isUsableCustomerLocation(customerCoords)} />) : null}
                    {catalogUnavailable ? (
                      <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" data-testid="booking-catalog-unavailable">
                        <p className="text-base font-bold">{catalogUnavailableNotice}</p>
                        <p className="mt-2 text-sm">{catalogUnavailableFollowUp}</p>
                      </div>
                    ) : null}
                    {catalogStatus === 'error' ? (
                      <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm text-red-900" data-testid="booking-catalog-error">
                        <p className="text-base font-bold">Therapist catalog could not be loaded.</p>
                        <p className="mt-2">Live therapist results are unavailable. Please try again in a few minutes, or message us on WhatsApp to book.</p>
                        
                      </div>
                    ) : null}
                    {catalogStatus === 'ready' && hasSpecificTherapists && wallTherapistsForTime.length === 0 ? (
                      scheduleMode === 'scheduled' && wallTimeMatch.status === 'ready' && wallTherapists.length > 0 ? (
                        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" data-testid="booking-time-no-results">
                          <p className="font-bold">No therapist is free at {wallTimeMatch.requested ? formatScheduleLabel(wallTimeMatch.requested.date, wallTimeMatch.requested.time) : 'that time'}.</p>
                          <p className="mt-1">Try another time, or switch to <strong>⚡ Now</strong> to see who can come soonest.</p>
                        </div>
                      ) : (
                        <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 text-sm text-gray-600" data-testid="booking-search-no-results"><p className="font-bold text-[#0F0F0F]">No therapists match your search.</p><p className="mt-1">Try a different name, area, or service filter.</p></div>
                      )
                    ) : null}
                  </div>
                </div>
              ) : null}

              {step === 'detail' && selectedTherapist ? <TherapistDetail therapist={selectedTherapist} availableServices={availableServices} selectedServiceName={formData.service} selectedDuration={Number(formData.durationMinutes)} totalAmount={selectedTotalAmount} onSelectService={handleSelectService} onSelectDuration={handleSelectDuration} onBack={() => setStep('wall')} onBook={handleBookSelection} promoDiscount={promoState.discount} /> : null}

              {step === 'email' ? (
                <form onSubmit={handleEmailContinue} className="space-y-5">
                  <div>
                    <h3 className="text-2xl font-bold text-[#0F0F0F]">Use this email for your booking</h3>
                    <p className="mt-2 text-sm text-gray-600">We use email to keep the booking request connected to you. Confirmation still happens on WhatsApp.</p>
                  </div>
                  <div className={summaryCardClass}>
                    <div className="flex justify-between gap-4"><span className={summaryLabelClass}>Therapist</span><strong className={summaryValueClass}>{selectedTherapist.name}</strong></div>
                    <div className="mt-2 flex justify-between gap-4"><span className={summaryLabelClass}>Service</span><strong className={summaryValueClass}>{formData.service} / {formData.durationMinutes} mins</strong></div>
                    <div className="mt-2 flex justify-between gap-4"><span className={summaryLabelClass}>Total</span><PriceWithDiscount amount={selectedTotalAmount} discount={promoState.discount} mainClassName={summaryMoneyClass} /></div>
                  </div>
                  <label className={bookingLabelClass}><Mail className="mr-2 inline h-4 w-4" />Email *</label>
                  <input className={bookingInputClass} type="email" value={emailDraft.email} onChange={event => setEmailDraft(current => ({ ...current, email: event.target.value }))} placeholder="you@example.com" data-testid="booking-email" data-readability-field="booking-email" required />
                  <p className="-mt-3 text-xs font-medium leading-5 text-[#4E8D43]">Use this email to log in and track your booking anytime after you order.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={bookingLabelClass}>Name optional</label>
                      <input className={bookingInputClass} value={emailDraft.name} onChange={event => setEmailDraft(current => ({ ...current, name: event.target.value }))} placeholder="Your name" data-readability-field="customerName" />
                    </div>
                    <div>
                      {/* ⚠ 2026-07-29 老板拍板:优惠直接挂在手机号这一格。
                          客人不知道为什么要填手机号,给他一个理由 —— 而且这句话
                          就是广告承诺的兑现点,必须出现在他填号码的那一刻。 */}
                      <label className={bookingLabelClass}>Phone</label>
                      <p className="-mt-2 mb-2 text-xs font-bold leading-5 text-[#0E6F1A]">
                        First booking? Enter your mobile to get ₱150 off — applied automatically.
                      </p>
                      <div className="flex gap-2">
                        <select aria-label="Phone country" className="h-12 w-[8.25rem] shrink-0 rounded-2xl border border-gray-300 bg-white px-3 text-sm font-bold text-[#0F0F0F] focus:border-[#4E8D43] focus:outline-none" value={phoneCountry} onChange={event => setPhoneCountry(event.target.value)}>
                          {BOOKING_PHONE_COUNTRIES.map(country => <option key={country.iso} value={country.iso}>{country.flag} +{country.callingCode}</option>)}
                        </select>
                        <div className="relative min-w-0 flex-1">
                          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-gray-500">+{bookingPhoneCountry(phoneCountry).callingCode}</span>
                          <input autoComplete="tel-national" className={`${bookingInputClass} pl-14`} inputMode="tel" value={emailDraft.phone} onChange={event => setEmailDraft(current => ({ ...current, phone: event.target.value }))} placeholder="908 123 4567" data-readability-field="phone" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="h-12 w-full rounded-2xl bg-[#4E8D43] px-6 font-bold text-white hover:bg-[#3F7838]">Continue with email</button>
                </form>
              ) : null}

              {step === 'details' ? (
                <form onSubmit={handleDetailsContinue} className="space-y-5">
                  <div>
                    <h3 className="text-2xl font-bold text-[#0F0F0F]">Customer and address details</h3>
                    <p className="mt-2 text-sm text-gray-600">We only need your contact details, schedule, and exact service location.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={bookingLabelClass}><User className="mr-2 inline h-4 w-4" />Full name *</label>
                      <input className={bookingInputClass} value={formData.customerName} onChange={event => updateField('customerName', event.target.value)} placeholder="Your full name" data-readability-field="customerName" required />
                    </div>
                    <div>
                      <label className={bookingLabelClass}><Phone className="mr-2 inline h-4 w-4" />WhatsApp / Phone *</label>
                      <div className="flex gap-2">
                        <select aria-label="Phone country" className="h-12 w-[8.25rem] shrink-0 rounded-2xl border border-gray-300 bg-white px-3 text-sm font-bold text-[#0F0F0F] focus:border-[#4E8D43] focus:outline-none" value={phoneCountry} onChange={event => { setPhoneCountry(event.target.value); setPhoneError(''); }}>
                          {BOOKING_PHONE_COUNTRIES.map(country => <option key={country.iso} value={country.iso}>{country.flag} +{country.callingCode}</option>)}
                        </select>
                        <div className="relative min-w-0 flex-1">
                          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-gray-500">+{bookingPhoneCountry(phoneCountry).callingCode}</span>
                          <input autoComplete="tel-national" className={`${bookingInputClass} pl-14`} inputMode="tel" value={formData.phone} onChange={event => handlePhoneChange(event.target.value)} onBlur={validatePhoneField} placeholder="908 123 4567" data-readability-field="phone" required />
                        </div>
                      </div>
                      {phoneError ? <p className="mt-2 text-sm font-medium text-red-600">{phoneError}</p> : null}
                    </div>
                  </div>
                  <ScheduleChooser
                    mode={scheduleMode}
                    onModeChange={mode => { setScheduleMode(mode); setScheduleSlot(null); if (error) setError(''); }}
                    slot={scheduleSlot}
                    onSlotChange={slot => { setScheduleSlot(slot.time ? slot : { date: slot.date, time: '' }); if (error) setError(''); }}
                    days={availability.days}
                    loading={availability.status === 'loading'}
                    loadFailed={availability.status === 'failed'}
                    earliestLabel={availability.earliest ? formatScheduleLabel(availability.earliest.dateKey, availability.earliest.time) : ''}
                    therapistName={selectedTherapist?.name || ''}
                  />
                  <div className={addressFeedback === 'success' ? 'rounded-2xl ring-4 ring-[#4E8D43]/20 transition' : 'transition'} data-location-address-feedback={addressFeedback || undefined} ref={addressFieldRef}>
                    <label className={bookingLabelClass}><MapPin className="mr-2 inline h-4 w-4" />Building, condo, hotel, or exact address *</label>
                    <p className="mb-2 text-xs text-gray-500">Type or search your building</p>
                    <AddressAutocompleteInput
                      value={formData.addressNote}
                      inputClassName={`${bookingInputClass} ${addressFeedback === 'success' ? 'border-[#4E8D43] bg-[#F1FBF3]' : ''}`}
                      placeholder="Start typing your building, condo, or hotel"
                      onTextChange={text => { setAddressFeedback(''); updateField('addressNote', text); }}
                      onLocationResolved={updateCustomerLocation}
                    />
                    {addressFeedback === 'error' ? <p className="mt-2 text-xs font-semibold text-amber-700">Couldn't fetch the address - please type it in</p> : null}
                  </div>
                  <div>
                    <label className={bookingLabelClass}><MapPin className="mr-2 inline h-4 w-4" />Pin your location on the map <span className="font-normal text-gray-500">(helps us send the nearest therapist)</span></label>
                    <p className="mb-2 text-xs text-gray-500">Or use GPS / drag the pin</p>
                    <LocationPicker value={formData.customerLocation} onChange={updateCustomerLocation} onAddress={handleResolvedAddress} />
                  </div>
                  <div>
                    <label className={bookingLabelClass}><MessageSquare className="mr-2 inline h-4 w-4" />Arrival notes (optional)</label>
                    <textarea className={bookingTextareaClass} rows={3} value={formData.notes} onChange={event => updateField('notes', event.target.value)} placeholder="Building entrance, parking, gate code, or how to find you" data-readability-field="notes" />
                  </div>
                  <button type="submit" data-testid="review-cash-booking" className="h-12 w-full rounded-2xl bg-[#4E8D43] px-6 font-bold text-white hover:bg-[#3F7838]">Review cash booking</button>
                </form>
              ) : null}

              {step === 'confirm' ? (
                <form onSubmit={handleSubmit} className="space-y-5" data-testid="confirm-step">
                  <div>
                    <h3 className="text-2xl font-bold text-[#0F0F0F]">Confirm Cash before service</h3>
                    <p className="mt-2 text-sm text-gray-600">Payment will be collected when the therapist arrives, before the massage starts. No online payment is collected on this website.</p>
                  </div>
                  <div className={summaryCardClass}>
                    <div className="grid gap-3">
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Therapist</strong><span className={summaryValueClass}>{selectedTherapist.name}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Service</strong><span className={summaryValueClass}>{formData.service} / {formData.durationMinutes} mins</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Schedule</strong><span className={summaryValueClass} data-testid="confirm-schedule">{scheduleMode === 'scheduled' && scheduleSlot?.time
                        ? formatScheduleLabel(scheduleSlot.date, scheduleSlot.time)
                        : 'ASAP — therapist departs after accepting'}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Address</strong><span className={summaryValueClass}>{inferAreaFromAddress(formData.addressNote)} - {formData.addressNote}</span></div>
                      <BookingCouponAmounts couponPreview={couponPreview} selectedTotalAmount={selectedTotalAmount} promoDiscount={promoState.discount} />
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>Payment</strong><span className={summaryValueClass}>Cash before service</span></div>
                    </div>
                  </div>
                  <BookingCouponSelector
                    couponPreviewState={couponPreviewState}
                    couponPreview={couponPreview}
                    couponOptOut={couponOptOut}
                    onRetry={() => void requestCouponPreview(couponOptOut)}
                    onOptOut={() => {
                      setCouponOptOut(true);
                      void requestCouponPreview(true);
                    }}
                    onUseCoupon={() => {
                      setCouponOptOut(false);
                      void requestCouponPreview(false);
                    }}
                  />
                  <button type="submit" disabled={isSubmitting || couponPreviewState !== 'ready'} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#4E8D43] px-6 font-bold text-white hover:bg-[#3F7838] disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Submitting...</> : 'Submit booking request'}
                  </button>
                </form>
              ) : null}

            </div>
          </motion.div>
          {activeBookingDialog ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onClick={event => event.stopPropagation()}
            >
              <motion.form
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="active-booking-dialog-title"
                data-testid="active-booking-dialog"
                className="w-full max-w-md rounded-[1.75rem] border border-amber-200 bg-white p-5 shadow-2xl sm:p-6"
                onSubmit={handleActiveBookingCancellation}
                onClick={event => event.stopPropagation()}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Clock className="h-6 w-6" />
                </div>
                <h2 id="active-booking-dialog-title" className="mt-4 text-2xl font-bold text-[#0F0F0F]">You already have a booking waiting for confirmation</h2>
                <p className="mt-3 break-all font-mono text-xs text-gray-500">{activeBookingDialog.reference}</p>
                {activeBookingDialog.notice ? (
                  <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">{activeBookingDialog.notice}</p>
                ) : null}
                {!activeCancelConfirming ? (
                  <div className="mt-6 grid gap-3">
                    {activeBookingDialog.persisted ? (
                      <button
                        type="button"
                        onClick={() => {
                          activeBookingInspectionSequenceRef.current += 1;
                          setActiveBookingDialog(null);
                          setIsOpen(false);
                          router.push(`/track/${encodeURIComponent(activeBookingDialog.reference)}`);
                        }}
                        className="h-12 rounded-2xl bg-[#4E8D43] px-4 font-bold text-white transition hover:bg-[#3F7838]"
                      >
                        View my booking
                      </button>
                    ) : (
                      <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                        This browser could not save your cancellation credential. Keep this page open to cancel, or contact us on WhatsApp.
                      </p>
                    )}
                    <button type="submit" className="h-12 rounded-2xl border border-red-200 bg-white px-4 font-bold text-red-700 transition hover:bg-red-50">
                      Cancel that booking
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <p className="text-sm leading-6 text-gray-600">Enter the email or phone used for this booking, then confirm cancellation.</p>
                    <div>
                      <label htmlFor="active-booking-contact" className={bookingLabelClass}>Booking email or phone</label>
                      <input
                        id="active-booking-contact"
                        value={activeCancelContact}
                        onChange={event => {
                          setActiveCancelContact(event.target.value);
                          setActiveCancelError('');
                        }}
                        className={bookingInputClass}
                        autoComplete="email"
                        required
                      />
                    </div>
                    {activeCancelError ? <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{activeCancelError}</p> : null}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCancelConfirming(false);
                          setActiveCancelError('');
                        }}
                        className="h-12 rounded-2xl border border-gray-200 bg-white px-4 font-bold text-gray-700 transition hover:bg-gray-50"
                      >
                        Keep booking
                      </button>
                      <button type="submit" disabled={activeCancelPending} className="h-12 rounded-2xl bg-red-600 px-4 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {activeCancelPending ? 'Cancelling...' : 'Confirm cancellation'}
                      </button>
                    </div>
                  </div>
                )}
              </motion.form>
            </motion.div>
          ) : null}
          {pendingRestingTherapistId ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
              onClick={event => {
                event.stopPropagation();
                cancelRestingTherapistSelection();
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="resting-therapist-warning-title"
                data-testid="resting-therapist-warning"
                className="w-full max-w-md rounded-[1.75rem] border border-amber-200 bg-white p-5 shadow-2xl sm:p-6"
                onClick={event => event.stopPropagation()}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h2 id="resting-therapist-warning-title" className="mt-4 text-2xl font-bold text-[#0F0F0F]">Warning</h2>
                {findWebsiteTherapist(pendingRestingTherapistId, bookingTherapists)?.technicianAccountId ? (
                  <>
                    <p className="mt-3 text-sm leading-6 text-gray-600">Therapist is currently resting, low chance of accepting orders, do you still want to continue?</p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <button type="button" onClick={cancelRestingTherapistSelection} className="h-12 rounded-2xl border border-gray-200 bg-white px-4 font-bold text-gray-700 transition hover:bg-gray-50">
                        Cancel
                      </button>
                      <button type="button" onClick={continueRestingTherapistSelection} className="h-12 rounded-2xl bg-[#4E8D43] px-4 font-bold text-white transition hover:bg-[#3F7838]">
                        Continue anyway
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm leading-6 text-gray-600">This therapist is currently resting and not accepting bookings. Please choose another therapist.</p>
                    <div className="mt-6">
                      <button type="button" onClick={cancelRestingTherapistSelection} className="h-12 w-full rounded-2xl bg-[#4E8D43] px-4 font-bold text-white transition hover:bg-[#3F7838]">
                        Choose another therapist
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
