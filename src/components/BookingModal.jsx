'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { intlLocale, routing } from '@/i18n/routing';
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
  readActiveBooking,
  resolveActiveBookingGate,
  writeActiveBooking
} from '../lib/activeBooking.mjs';
import { cancelPublicBooking } from '../lib/publicBookingCancel.mjs';
import { LocationPicker } from './LocationPicker.jsx';
import { trackMetaEvent, identifyMetaUser } from './MetaPixel.jsx';
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
// 后台广播用的租户频道名(与 ai-office-admin 的 DEFAULT_TENANT_ID 一致);可用环境变量覆盖
const LIVE_TENANT_ID = process.env.NEXT_PUBLIC_LIVE_TENANT_ID || 'brand-a';
// 品牌名不进文字文件,用变量塞进去(src/i18n/做法.md)
const BRAND_NAME = 'EasyGoSpa';
const bookingInputClass = 'h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 font-medium text-[#171A17] caret-[#171A17] placeholder:text-gray-500 focus:border-[#64734F] focus:outline-none';
const bookingTextareaClass = `${bookingInputClass} min-h-28 resize-none py-3`;
const bookingLabelClass = 'mb-2 block text-sm font-semibold text-slate-800';
const summaryCardClass = 'rounded-[1.5rem] border border-[#64734F]/30 bg-[#F2F4EC] p-5 text-sm';
const summaryLabelClass = 'font-semibold text-slate-700';
const summaryValueClass = 'text-right font-semibold text-[#171A17]';
const summaryMoneyClass = 'text-right font-bold text-[#55633F]';

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
// 2026-07-30 修:原来用 Math.min 封顶在 23:55 不跨日——23:25 之后点"尽快上门",
// 时间被钉成"今天 23:55"(实际应是明天 00:xx),日期和时间双错。现在整点跨日。
function manilaAsapSlot() {
  const total = manilaNowMinutes() + BOOKING_LEAD_MINUTES;
  const minutes = ((total % 1440) + 1440) % 1440;
  return {
    date: total >= 1440 ? manilaDateKeyWithOffset(1) : manilaToday(),
    time: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  };
}

// Owner call (2026-07-29): "book for later" is back, but it may only ever offer
// slots the therapist can genuinely serve — the pre-2026-07-16 picker listed all 48
// half-hours regardless of her shift, which is how customers booked times nobody
// could work. Every time shown here comes from the backend availability check.

function manilaDayLabel(dateKey = '', dayOffset = 0, t, locale) {
  if (dayOffset === 0) return t('time.today');
  if (dayOffset === 1) return t('time.tomorrow');
  // 老板 2026-07-30 抓的 BUG:原来用 getUTCDay() 算星期,马尼拉+8 被倒推成前一天,
  // 8月1号(周六)显示成 "Fri 01"。星期必须按马尼拉时区取。
  const parsed = new Date(`${dateKey}T12:00:00+08:00`);
  if (!Number.isFinite(parsed.getTime())) return dateKey;
  const weekday = new Intl.DateTimeFormat(intlLocale(locale), { timeZone: 'Asia/Manila', weekday: 'short' }).format(parsed);
  // 英文照旧写两位数（Sat 08）；中日韩等写「8日」不补零
  const day = locale === 'en' ? dateKey.slice(8, 10) : String(Number(dateKey.slice(8, 10)));
  return t('time.weekdayDay', { weekday, day });
}

// 技师墙"约稍后"要给客人挑今天/明天/后天——后台档期扫描也只看 3 天。
function manilaDateKeyWithOffset(offset = 0) {
  const ms = Date.parse(`${manilaToday()}T12:00:00+08:00`) + offset * 86400000;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date(ms));
}

// 墙上还没选服务,不知道时长;先按最常见的 60 分钟问"这个点谁能来"。
// 真正的档期校验在选完技师和服务后(表单的按人时段表 + 后端 verifyScheduledSlot)还会各把一道关。
const WALL_TIME_MATCH_DURATION_MINUTES = 60;

function formatScheduleLabel(dateKey = '', time = '', t) {
  if (!dateKey || !time) return '';
  const today = manilaToday();
  if (dateKey === today) return t('time.todayAt', { time });
  const parsed = new Date(`${dateKey}T00:00:00+08:00`);
  const tomorrow = new Date(`${today}T00:00:00+08:00`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (parsed.toISOString().slice(0, 10) === tomorrow.toISOString().slice(0, 10)) return t('time.tomorrowAt', { time });
  return `${dateKey} ${time}`;
}

// 技师卡上的「最早可约」是后台给的英文短语:"HH:MM" / "Tomorrow HH:MM" / "Jul 20, 09:00"。
// 只为显示换成当前语言;英文原样不动(月份缩写交给浏览器可能写成 "Sept",跟后台不一致)。
const EARLIEST_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function localizeEarliestAvailable(text = '', t, locale) {
  const value = String(text || '');
  const tomorrowMatch = /^Tomorrow (\d{2}:\d{2})$/.exec(value);
  if (tomorrowMatch) return t('time.tomorrowAt', { time: tomorrowMatch[1] });
  const dateMatch = /^([A-Z][a-z]{2}) (\d{1,2}), (\d{2}:\d{2})$/.exec(value);
  if (!dateMatch || locale === routing.defaultLocale) return value;
  const monthIndex = EARLIEST_MONTHS.indexOf(dateMatch[1]);
  if (monthIndex < 0) return value;
  const [yearText, monthText] = manilaToday().split('-');
  const currentMonthIndex = Number(monthText) - 1;
  // 12 月看到 "Jan 02" = 明年
  const year = Number(yearText) + (monthIndex < currentMonthIndex - 6 ? 1 : 0);
  const parsed = new Date(`${year}-${String(monthIndex + 1).padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}T12:00:00+08:00`);
  if (!Number.isFinite(parsed.getTime())) return value;
  const date = new Intl.DateTimeFormat(intlLocale(locale), { timeZone: 'Asia/Manila', month: 'short', day: 'numeric' }).format(parsed);
  return t('time.dateAt', { date, time: dateMatch[3] });
}

// 服务名是后台给的英文(也是发给服务器的值,不能改);只在显示时查 serviceNames 换成当前语言,查不到就原样。
function useServiceLabel() {
  const tn = useTranslations('serviceNames');
  return useCallback(name => (name && tn.has(name) ? tn(name) : name), [tn]);
}

// 服务半径闸门的三句话在 therapistServiceBookingFlow.mjs 里是英文常量(别的检查脚本也认它们),
// 显示时按常量对应成当前语言。
function radiusMessageText(message, t) {
  if (message === SERVICE_RADIUS_LOCATION_REQUIRED_MESSAGE) return t('wall.card.locationHint');
  if (message === SERVICE_RADIUS_TOO_FAR_MESSAGE) return t('wall.card.tooFarHint', { km: MAX_SERVICE_DISTANCE_KM });
  if (message === THERAPIST_TEMPORARILY_UNAVAILABLE_MESSAGE) return t('wall.card.unavailableHint');
  return message;
}

// 下单接口(/api/booking-request)回来的报错:代码固定、英文固定的那些按代码翻;
// 其余(没有代码或代码对应多种英文)原样显示服务器那句英文。
function serverErrorText(payload, fallback, t) {
  if (!payload?.error) return fallback;
  switch (payload.code) {
    case 'OUTSIDE_SERVICE_AREA': return t('server.outsideServiceArea');
    case 'PREFERRED_TIME_REQUIRED': return t('server.preferredTimeRequired');
    case 'CUSTOMER_NAME_REQUIRED': return t('server.customerNameRequired');
    case 'PEOPLE_COUNT_INVALID': return t('server.peopleCountInvalid');
    case 'THERAPIST_PREFERENCE_INVALID': return t('server.therapistPreferenceInvalid');
    case 'PUBLIC_BOOKING_CURRENCY_CONFLICT': return t('server.currencyConflict');
    case 'PUBLIC_BOOKING_OPTION_NOT_AVAILABLE': return t('server.optionNotAvailable');
    case 'PUBLIC_BOOKING_PRICE_INVALID': return t('server.priceInvalid');
    case 'PUBLIC_BOOKING_SERVICE_NOT_AVAILABLE': return t('server.serviceNotAvailable');
    case 'RATE_LIMITED': return t('errors.rateLimited');
    case 'RATE_LIMITER_UNAVAILABLE': return t('server.rateLimiterUnavailable');
    case 'AIOFFICE_BOOKING_REQUEST_FAILED': return t('errors.submitFailed');
    case 'INVALID_BOOKING_REQUEST': return t('server.invalidRequest');
    case 'AIOFFICE_BOOKING_RECOVERY_CREDENTIAL_MISSING':
    case 'AIOFFICE_BOOKING_CANCEL_TOKEN_MISSING': return t('server.credentialMissing');
    case 'AIOFFICE_BOOKING_REFERENCE_MISSING': return t('errors.notConfirmed');
    case 'AIOFFICE_BOOKING_API_UNAVAILABLE': return t('server.apiUnavailable');
    default: return payload.error;
  }
}

// 取消接口的报错在 publicBookingCancel.mjs 里按 code 固定,这里按 code 翻(那个文件别人也在用,英文不动)。
function cancelErrorText(result, t) {
  switch (result?.code) {
    case 'INVALID_CANCELLATION': return t('active.errors.contactRequired');
    case 'CANCEL_AUTH_REQUIRED': return t('active.errors.authRequired');
    case 'CANCEL_NOT_ALLOWED': return t('active.errors.notAllowed');
    case 'RATE_LIMITED': return t('errors.rateLimited');
    case 'BOOKING_CANCEL_FAILED': return t('active.errors.failed');
    case 'BOOKING_CANCEL_UNAVAILABLE': return t('active.errors.unreachable');
    default: return result?.error || t('active.errors.unavailable');
  }
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
  const t = useTranslations('booking');
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
        <strong className={summaryLabelClass}>{t('common.total')}</strong>
        <span className={discount > 0 ? 'text-base font-semibold text-gray-400 line-through' : summaryMoneyClass}>
          {peso(gross)}
        </span>
      </div>
      {discount > 0 ? (
        <>
          <div className="flex justify-between gap-4 text-[#55633F]" data-testid="booking-coupon-discount"><strong>{t('confirm.discount')}</strong><span className="font-bold">{t('confirm.discountAuto', { amount: peso(discount) })}</span></div>
          <div className="flex items-baseline justify-between gap-4 border-t border-[#64734F]/20 pt-3" data-testid="booking-cash-to-collect"><strong className="text-base text-[#171A17]">{t('confirm.cashPayment')}</strong><span className="text-2xl font-extrabold text-[#171A17]">{peso(cashToCollect)}</span></div>
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
  const t = useTranslations('booking');
  return (
    <section className="rounded-[1.5rem] border border-gray-200 bg-white p-5" data-testid="booking-coupon-selector">
      <h4 className="font-bold text-[#171A17]">{t('coupon.title')}</h4>
      <p className="mt-1 text-xs leading-5 text-gray-500">{t('coupon.intro')}</p>
      <div className="mt-4" aria-live="polite">
        {couponPreviewState === 'loading' ? <p className="text-sm text-gray-500">{t('coupon.checking')}</p> : null}
        {couponPreviewState === 'error' ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">{t('coupon.error')}</p>
            <button type="button" onClick={onRetry} className="mt-2 text-sm font-bold text-[#55633F]">{t('coupon.retry')}</button>
          </div>
        ) : null}
        {/* ⚠ 2026-07-29:下面几条原来全按 couponApplied 分支,而新客活动券那个标志永远是 false,
            于是刚领了 ₱150 的客人会看到「Sign in to My orders 才能用券」—— 完全误导。
            现在统一按"实际减了多少钱"判断:减了就说减了,是哪种券客人不需要知道。
            「不用券」那个开关只对账号券有意义,活动券不给这个选项(它是广告给的,没人想退掉)。 */}
        {couponPreviewState === 'ready' && couponDiscountAmount(couponPreview) > 0 ? (
          <div className="rounded-2xl bg-[#F2F4EC] p-4">
            <p className="text-sm font-bold text-[#55633F]">{t('coupon.appliedTitle', { amount: peso(couponDiscountAmount(couponPreview)) })}</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">{t('coupon.appliedBody')}</p>
            {couponPreview?.couponApplied === true ? (
              <button type="button" onClick={onOptOut} className="mt-3 text-xs font-bold text-gray-500 underline decoration-gray-300 underline-offset-4">{t('coupon.optOut')}</button>
            ) : null}
          </div>
        ) : null}
        {couponPreviewState === 'ready' && couponDiscountAmount(couponPreview) === 0 && couponOptOut ? (
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-600">{t('coupon.notApplied')}</p>
            <button type="button" onClick={onUseCoupon} className="mt-3 text-xs font-bold text-[#55633F] underline decoration-[#64734F]/40 underline-offset-4">{t('coupon.useAuto')}</button>
          </div>
        ) : null}
        {couponPreviewState === 'ready' && couponDiscountAmount(couponPreview) === 0 && !couponOptOut ? (
          couponPreview?.customerIdentityVerified === true
            ? <p className="text-sm text-gray-500">{t('coupon.noneVerified')}</p>
            : <p className="text-sm text-gray-500">{t('coupon.noneGuest')}</p>
        ) : null}
      </div>
    </section>
  );
}

// 2026-07-30 老板拍板:"现在 / 约稍后"的选择上了技师墙,表单里不再重复问一遍。
// 这里只做两件事:①把墙上选好的时间念回来给客人确认 ②万一这位技师接不了那个点
// (墙上按 60 分钟估的,她的真档期在这里才知道),就地给她的真实空档重选,不用回墙。
function ScheduleChooser({ mode, slot, onSlotChange, days, loading, loadFailed, earliestLabel, therapistName, onChangeOnWall }) {
  const t = useTranslations('booking');
  const locale = useLocale();
  const strong = chunks => <strong>{chunks}</strong>;
  const activeDate = slot?.date || days[0]?.date || '';
  const activeDay = days.find(day => day.date === activeDate) || days[0] || null;
  const slotConfirmed = Boolean(slot?.time) && days.some(day => day.date === slot.date && day.times.includes(slot.time));

  return (
    <div className="space-y-3" data-testid="schedule-chooser">
      <label className={bookingLabelClass}><Clock className="mr-2 inline h-4 w-4" />{t('schedule.question')}</label>

      {mode === 'asap' ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#E9ECE1] px-4 py-3 text-sm font-medium text-[#55633F]">
          <span><Clock className="mr-2 inline h-4 w-4" />{t('schedule.asap')}</span>
          <button type="button" onClick={onChangeOnWall} data-testid="schedule-change-on-wall" className="shrink-0 text-sm font-bold underline underline-offset-2">{t('schedule.change')}</button>
        </div>
      ) : slotConfirmed ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#E9ECE1] px-4 py-3 text-sm font-medium text-[#55633F]" data-testid="schedule-summary">
          <span><Clock className="mr-2 inline h-4 w-4" />{therapistName
            ? t.rich('schedule.appointmentWith', { b: strong, when: formatScheduleLabel(slot.date, slot.time, t), name: therapistName })
            : t.rich('schedule.appointment', { b: strong, when: formatScheduleLabel(slot.date, slot.time, t) })}</span>
          <button type="button" onClick={onChangeOnWall} data-testid="schedule-change-on-wall" className="shrink-0 text-sm font-bold underline underline-offset-2">{t('schedule.change')}</button>
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600">{therapistName ? t('schedule.checkingNamed', { name: therapistName }) : t('schedule.checkingHer')}</div>
      ) : loadFailed ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" data-testid="schedule-load-failed">
          {t.rich('schedule.loadFailed', { b: strong })}
        </div>
      ) : !days.length ? (
        // Fail loudly rather than showing an empty list — an empty picker is exactly
        // what sent the 2026-07-29 guest to WhatsApp asking "is there any time?".
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" data-testid="schedule-no-slots">
          {earliestLabel
            ? t.rich('schedule.noSlotsEarliest', { b: strong, name: therapistName || t('common.thisTherapist'), earliest: earliestLabel })
            : t.rich('schedule.noSlots', { b: strong, name: therapistName || t('common.thisTherapist') })}
        </div>
      ) : (
        <div className="space-y-3">
          {/* 走到这里 = 还没有落定的时间:要么墙上只选了"约稍后"没挑点,要么挑的点
              这位技师这个时长接不了(墙按60分钟估,她的真档期这里才知道)。
              就地用她的真实空档选,不逼客人回墙从头来。 */}
          <p className="text-sm font-medium text-gray-600" data-testid="schedule-repick-note">
            {therapistName ? t('schedule.repickNamed', { name: therapistName }) : t('schedule.repickHer')}
          </p>
          <div className="flex flex-wrap gap-2">
            {days.map(day => (
              <button
                key={day.date}
                type="button"
                onClick={() => onSlotChange({ date: day.date, time: '' })}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition ${day.date === activeDate
                  ? 'border-[#64734F] bg-[#64734F] text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#64734F]'}`}
              >
                {manilaDayLabel(day.date, day.dayOffset, t, locale)}
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
                  ? 'border-[#64734F] bg-[#F2F4EC] text-[#55633F]'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#64734F]'}`}
                data-testid={`schedule-time-${time}`}
              >
                {time}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">{therapistName ? t('schedule.onlyTimesNamed', { name: therapistName }) : t('schedule.onlyTimesShe')}</p>
        </div>
      )}
    </div>
  );
}

function formatReviewDate(value, t, locale) {
  if (!value) return t('time.recently');
  try {
    return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  } catch {
    return t('time.recently');
  }
}

// 评分显示(老板 2026-08-01 拍板):初始 5 分扣分制不变(Uber/Grab 同款,新人无罪推定),
// 但星级要带"分母"才立得住——有评价:★4.8 (12 reviews);没评价:★5.0 + NEW 徽章。
// 不再显示 "(0 reviews)":裸 5.0 配零条数,在精明客人眼里反而像假的。
// 攒够真评价后 rating/reviewCount 有值,自动切成真实平均分。
function TherapistRating({ therapist = {} }) {
  const t = useTranslations('booking');
  const ratingRaw = Number(therapist.rating);
  const countRaw = Number(therapist.reviewCount);
  const hasReviews = Number.isFinite(ratingRaw) && ratingRaw > 0 && Number.isFinite(countRaw) && countRaw > 0;
  const rating = hasReviews ? Math.min(5, ratingRaw) : 5;
  const reviewCount = hasReviews ? countRaw : 0;

  return (
    <span
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={hasReviews ? t('therapist.ratingAria', { rating: rating.toFixed(1), count: reviewCount }) : t('therapist.ratingAriaNew')}
    >
      <Star className="h-4 w-4 shrink-0 fill-[#f0a41c] text-[#f0a41c]" aria-hidden="true" />
      <span className="font-bold text-[#e08700]">{rating.toFixed(1)}</span>
      {hasReviews
        ? <span className="font-medium text-gray-500">{t('therapist.reviewCount', { count: reviewCount })}</span>
        : <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-sky-700">{t('therapist.newBadge')}</span>}
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
    // 2026-08-01 去邮箱:身份主键改手机号;老 session 只有邮箱的也认(平滑过渡)
    const hasPhone = String(parsed.phone || '').replace(/\D/g, '').length >= 7;
    return hasPhone || isValidEmail(parsed.customerEmail) ? parsed : null;
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
  const t = useTranslations('booking');
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
      alt={t('therapist.avatarAlt', { name: therapist.name })}
      loading="lazy"
      decoding="async"
      data-testid={mode === 'detail' ? 'therapist-detail-image' : 'therapist-list-image'}
      className={`${sizeClass} ${radiusClass} ${fitClass} shrink-0 bg-[#EAF8ED] ring-1 ring-gray-200`}
    />
  );
}

function TherapistWallCard({ therapist, selected, onSelect, onRequireLocation, customerLocated = false }) {
  const t = useTranslations('booking');
  const locale = useLocale();
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
      className={`relative w-full cursor-pointer overflow-hidden rounded-[1.5rem] border bg-white p-3 text-left shadow-sm transition-all ${selected ? 'border-[#64734F] shadow-md' : 'border-gray-100 hover:border-[#64734F]/60 hover:shadow-md'}`}
    >
      {therapist.isNew === true ? <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-sky-600 px-2 py-1 text-[10px] font-extrabold leading-none tracking-[0.12em] text-white shadow-sm" data-testid="therapist-new-badge">{t('therapist.newBadge')}</span> : null}
      {showRangeHint ? (
        <span
          role="status"
          data-testid={`therapist-card-out-of-range-hint-${therapist.id}`}
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-black/85 px-4 py-3 text-center text-sm font-semibold leading-5 text-white shadow-lg"
        >
          {radiusMessageText(distanceKm !== null ? SERVICE_RADIUS_TOO_FAR_MESSAGE : customerLocated ? THERAPIST_TEMPORARILY_UNAVAILABLE_MESSAGE : SERVICE_RADIUS_LOCATION_REQUIRED_MESSAGE, t)}
        </span>
      ) : null}
      <div className="flex min-h-[152px] gap-4">
        <TherapistAvatar therapist={therapist} mode="wall" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate text-[17px] font-bold leading-6 text-[#171A17]">{therapist.name}</h3>
            {/* Owner call (2026-07-18): show the earliest slot even off-shift —
                the backend now sends cross-day values like "Tomorrow 09:00". */}
            {therapist.earliestAvailable ? (
              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold leading-5 text-[#55633F]" data-testid="therapist-earliest-availability">
                <Clock className="h-3.5 w-3.5 shrink-0" />{t('wall.card.earliest', { time: localizeEarliestAvailable(therapist.earliestAvailable, t, locale) })}
              </span>
            ) : null}
            {selected ? <Check className="h-4 w-4 shrink-0 text-[#64734F]" /> : null}
          </div>
          {/* 老板 2026-07-24:卡片只留精华(名字/评分/距离/Book),对标对手一屏 6 个。
              删掉 Massage Therapist、覆盖区一长串、自我介绍——都挪到点进去的详情页。 */}
          <div className="mt-1.5 text-sm font-bold text-gray-700"><TherapistRating therapist={therapist} /></div>
          {distanceKm !== null && distanceKm <= 100 ? (
            <p className={`mt-2 flex items-center gap-1 text-xs font-semibold ${outOfRange ? 'text-gray-400' : 'text-[#55633F]'}`} data-testid="therapist-distance">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km
              {outOfRange ? <span data-testid="therapist-out-of-range-tag"> · {t('wall.card.tooFar')}</span> : null}
            </p>
          ) : null}
          <div className="mt-auto flex min-h-11 items-center justify-end gap-3 pt-2">
            {therapist.isMannequin ? (
              <span className="ml-auto inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-gray-100 px-4 text-sm font-bold text-gray-500" data-testid={`therapist-card-resting-${therapist.id}`}>{t('wall.card.resting')}</span>
            ) : (
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                openDetail();
              }}
              data-testid={`therapist-card-book-${therapist.id}`}
              aria-disabled={rangeBlocked || undefined}
              className={`ml-auto inline-flex h-11 min-w-20 shrink-0 items-center justify-center rounded-full px-4 text-sm font-bold transition ${rangeBlocked ? 'cursor-not-allowed bg-gray-200 text-gray-500' : 'bg-[#64734F] text-white hover:bg-[#55633F]'}`}
            >
              {t('common.book')}
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
  const t = useTranslations('booking');
  const serviceLabel = useServiceLabel();
  // 档位药丸常驻卡面(老板 2026-07-21 参考打车式竞品):没选中的卡也能看到
  // 60/90/120 全档,点任意档 = 同时选中该服务和该档;价格大字实时跟着档位走。
  const selectedOption = selected
    ? service.durationOptions.find(option => option.durationMinutes === selectedDuration) || null
    : null;
  const priceOption = selectedOption || defaultDurationOption(service);

  return (
    <section
      className={`cursor-pointer overflow-hidden rounded-[1.5rem] border shadow-sm transition-all ${selected ? 'border-[#64734F] bg-[#F2F4EC] ring-1 ring-[#64734F]/20' : 'border-gray-200 bg-white hover:border-[#64734F]/50 hover:shadow-md'}`}
      data-testid={`therapist-service-${service.id}`}
      onClick={() => onSelectService(service)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="block min-w-0 flex-1 text-lg font-bold text-[#171A17]">{serviceLabel(service.name)}</span>
          <button
            type="button"
            onClick={event => { event.stopPropagation(); onSelectService(service); }}
            data-testid={`service-select-${service.id}`}
            aria-pressed={selected}
            aria-label={t('therapist.selectService', { service: serviceLabel(service.name) })}
            className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${selected ? 'border-[#64734F] bg-[#64734F] text-white' : 'border-gray-300 bg-white text-transparent'}`}
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
                className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-all ${durationSelected ? 'border-[#64734F] bg-[#E9ECE1] text-[#55633F]' : 'border-gray-200 bg-white text-gray-700 hover:border-[#64734F]/60'}`}
              >
                {t('common.mins', { minutes: option.durationMinutes })}
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
              <PriceWithDiscount amount={priceOption.price} discount={promoDiscount} mainClassName="text-2xl font-extrabold text-[#171A17]" />
              <span className="text-xs font-semibold text-gray-500">/ {t('common.mins', { minutes: priceOption.durationMinutes })}</span>
            </div>
            {/* Book 长在选中的卡片里(老板 2026-07-21:底部长条挡视野,不要了)。 */}
            {selected && selectedOption ? (
              <button
                type="button"
                onClick={event => { event.stopPropagation(); onBook?.(); }}
                data-testid="detail-book"
                className="inline-flex h-11 min-w-24 shrink-0 items-center justify-center rounded-full bg-[#64734F] px-6 font-bold text-white transition hover:bg-[#55633F]"
              >
                {t('common.book')}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TherapistDetail({ therapist, availableServices, selectedServiceName, selectedDuration, totalAmount, onSelectService, onSelectDuration, onBack, onBook, promoDiscount = 0 }) {
  const t = useTranslations('booking');
  const locale = useLocale();
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState('');
  const aboutText = String(therapist.profileIntroduction || '').trim() || t('therapist.noIntro');
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
                    <img src={url} alt={t('therapist.photoAlt', { name: therapist.name, number: index + 1 })} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" className="h-full w-full object-cover object-top" />
                  </button>
                ))}
              </div>
              {photoIndex > 0 ? <button type="button" onClick={() => goToPhoto(photoIndex - 1)} aria-label={t('therapist.prevPhoto')} data-testid="hero-prev" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow"><ArrowLeft className="h-5 w-5" /></button> : null}
              {photoIndex < heroPhotos.length - 1 ? <button type="button" onClick={() => goToPhoto(photoIndex + 1)} aria-label={t('therapist.nextPhoto')} data-testid="hero-next" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow"><ArrowLeft className="h-5 w-5 rotate-180" /></button> : null}
              <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white" data-testid="therapist-hero-counter">{photoIndex + 1}/{heroPhotos.length}</span>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {heroPhotos.map((url, index) => <button key={url} type="button" aria-label={t('therapist.goToPhoto', { number: index + 1 })} onClick={() => goToPhoto(index)} className={`h-1.5 rounded-full transition-all ${index === photoIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`} />)}
              </div>
            </>
          ) : (
            <TherapistAvatar therapist={therapist} mode="detail" />
          )}
          <button type="button" onClick={onBack} className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-sm" aria-label={t('therapist.backToList')}><ArrowLeft className="h-5 w-5" /></button>
          {usesFallbackImage && heroPhotos.length === 0 ? <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#55633F]">{t('therapist.profileBadge', { brand: BRAND_NAME })}</span> : null}
        </div>
        <div className="p-5">
          <h3 className="text-3xl font-bold tracking-normal text-[#171A17]">{therapist.name}</h3>
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
            {/* 评分可点:跳到下方 Verified reviews 区(老板 2026-07-26:1 review 点不进去=没实装)。
                0 评价时下方整个评价区都藏了(老板 2026-08-01:空列表=当面承认没人用过),
                这时评分不做成跳转按钮——点了滚到不存在的地方比不能点更糟。 */}
            {reviewCount > 0 ? (
              <button
                type="button"
                data-testid="therapist-rating-link"
                className="inline-flex items-center gap-1 underline decoration-[#e08700]/40 underline-offset-4"
                onClick={() => document.getElementById('therapist-reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                <TherapistRating therapist={therapist} />
              </button>
            ) : (
              <span data-testid="therapist-rating-static"><TherapistRating therapist={therapist} /></span>
            )}
          </div>
          <div className="mt-4 flex items-center gap-4 rounded-2xl border border-[#64734F]/35 bg-[#F7FCF8] px-4 py-3" data-testid="therapist-care">
            <span className="flex flex-col items-center gap-1 text-[#55633F]">
              <ShieldCheck className="h-7 w-7" />
              <span className="text-[11px] font-bold leading-none">{t('therapist.care', { brand: BRAND_NAME })}</span>
            </span>
            <span className="grid gap-1.5 text-sm text-gray-800">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-[#55633F]" />{t('therapist.noTip')}</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-[#55633F]" />{t('therapist.noSensitiveInfo')}</span>
            </span>
          </div>
        </div>
      </section>
      {/* 老板 2026-07-19:原单独的"Photos"块已合进顶部相册,这里不再重复展示。 */}
      {lightboxUrl ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/85 p-4" role="dialog" aria-modal="true" onClick={() => setLightboxUrl('')}>
          <button type="button" aria-label={t('common.close')} onClick={() => setLightboxUrl('')} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"><X className="h-5 w-5" /></button>
          <img src={lightboxUrl} alt={t('therapist.lightboxAlt', { name: therapist.name })} className="max-h-[85vh] max-w-full rounded-2xl object-contain" onClick={event => event.stopPropagation()} />
        </div>
      ) : null}
      <section className="rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-sm" data-testid="therapist-about">
        <h3 className="mb-2 text-xl font-bold text-[#171A17]">{t('therapist.about', { name: therapist.name })}</h3>
        <p className={`text-sm leading-7 text-gray-700 ${shouldClampAbout && !showFullAbout ? 'line-clamp-4' : ''}`}>{aboutText}</p>
        {shouldClampAbout ? (
          <button type="button" onClick={() => setShowFullAbout(current => !current)} className="mt-2 text-sm font-bold text-[#55633F]">
            {showFullAbout ? t('therapist.showLess') : t('therapist.showMore')}
          </button>
        ) : null}
      </section>
      <div data-testid="therapist-services">
        <h3 className="text-2xl font-bold text-[#171A17]">{t('therapist.myServices')}</h3>
        <p className="mt-1 text-sm text-gray-600">{t('therapist.myServicesBody')}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {availableServices.map(service => <ServiceCard key={service.id} service={service} selected={selectedServiceName === service.name} selectedDuration={selectedServiceName === service.name ? Number(selectedDuration) : 0} onSelectService={onSelectService} onSelectDuration={onSelectDuration} onBook={onBook} promoDiscount={promoDiscount} />)}
        </div>
      </div>
      {/* 评价区空则整块藏(老板 2026-08-01 拍板):0 条还摆出"5.0 大字 + 全 0 分布条 +
          No verified reviews yet",等于当面承认没人用过。攒到第一条真评价它自己回来。 */}
      {reviewCount > 0 ? (
      <section className="rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-sm" data-testid="therapist-review-wall" id="therapist-reviews-section">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-[#f0a41c] text-[#f0a41c]" />
              <h4 className="font-bold text-[#171A17]">{t('therapist.verifiedReviews')}</h4>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <strong className="text-4xl font-extrabold text-[#171A17]">{averageRating.toFixed(1)}</strong>
              <span className="text-sm font-semibold text-gray-500">{t('therapist.reviewCount', { count: reviewCount })}</span>
            </div>
          </div>
          {verifiedReviews.length > 3 ? (
            <button type="button" onClick={() => setShowAllReviews(current => !current)} className="text-sm font-bold text-[#55633F]">
              {showAllReviews ? t('therapist.showRecent') : t('therapist.viewAll')}
            </button>
          ) : null}
        </div>
        <div className="mt-4 space-y-2" aria-label={t('therapist.ratingDistribution')}>
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
                  {/* 'Verified customer' 是 bookingCatalogNormalizer 打码时填的英文占位,显示时换成当前语言 */}
                  <strong className="text-sm text-[#171A17]">{!review.maskedCustomerName || review.maskedCustomerName === 'Verified customer' ? t('therapist.verifiedCustomer') : review.maskedCustomerName}</strong>
                  <span className="text-xs text-gray-400">{formatReviewDate(review.createdAt, t, locale)}</span>
                </div>
                <p className="mt-1 text-sm tracking-[0.08em] text-[#e08700]" aria-label={t('therapist.starsAria', { stars: review.stars })}>{'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}</p>
                {review.text ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{review.text}</p> : <p className="mt-2 text-sm italic text-gray-400">{t('therapist.starOnly')}</p>}
                {review.reply?.text ? (
                  <div className="mt-3 rounded-xl bg-[#F2F4EC] p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#55633F]">{t('therapist.reply', { brand: BRAND_NAME })}</p>
                    <p className="mt-1 text-sm leading-6 text-gray-700">{review.reply.text}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : <p className="mt-5 text-sm text-gray-600">{t('therapist.noReviews')}</p>}
      </section>
      ) : null}
      {/* 底部账单条已拆(老板 2026-07-21):Book 按钮直接长在选中的服务卡里。 */}
    </div>
  );
}

export default function BookingModal() {
  const t = useTranslations('booking');
  const locale = useLocale();
  const serviceLabel = useServiceLabel();
  const strong = chunks => <strong>{chunks}</strong>;
  const router = useRouter();
  const [bookingCatalog, setBookingCatalog] = useState(() => getFallbackWebsiteBookingCatalog());
  const [catalogStatus, setCatalogStatus] = useState('loading');
  const catalogStatusRef = useRef('loading');
  const catalogHydratedRef = useRef(false);
  // 上次成功拿到名单时后台给的 ETag(按请求地址记,带坐标和不带坐标是两份)
  const catalogEtagRef = useRef({ url: '', etag: '' });
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
  // 约稍后没选时间就点 Book → 高亮时间条提示先选(选完自动熄灭)。
  const [wallScheduleNudge, setWallScheduleNudge] = useState(false);
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
  const serviceTypeOptions = useMemo(() => serviceTypeOptionsForWall(catalogTherapists, catalogServices), [catalogTherapists, catalogServices]);
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
        // ②只传变化(2026-09-06):带上上次的 ETag,后台内容没变就回 304 零字节,墙原样不动。
        const knownEtag = catalogEtagRef.current.url === catalogUrl ? catalogEtagRef.current.etag : '';
        const response = await fetch(catalogUrl, {
          cache: 'no-store',
          headers: knownEtag ? { 'If-None-Match': knownEtag } : {}
        });
        if (response.status === 304 && knownEtag && catalogStatusRef.current === 'ready') return;
        const payload = await response.json().catch(() => null);
        if (!active || !response.ok || payload?.ok !== true) throw new Error('BOOKING_CATALOG_LOAD_FAILED');
        const nextEtag = String(response.headers.get('etag') || '').trim();
        catalogEtagRef.current = nextEtag ? { url: catalogUrl, etag: nextEtag } : { url: '', etag: '' };
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
    // 完成/退单→往前跳)。只在弹窗打开且页面可见时静默重拉,不闪 Loading、不顶掉已选技师。
    // 2026-09-06 老板拍板(数据库被轮询拖死后):改成 Supabase Realtime 广播驱动——后台每次
    // 写单/技师上下班会往 live:<tenant> 频道发一条"变了"(不带业务数据),官网收到才重拉;
    // 原来的 12 秒轮询降级为 60 秒兜底。频道上只有信号,真数据仍走 /api/booking-catalog。
    const refreshIfWatching = () => {
      if (bookingOpenRef.current && document.visibilityState === 'visible') loadBookingCatalog();
    };
    const liveTimer = window.setInterval(refreshIfWatching, 60000);
    const onVisible = refreshIfWatching;
    document.addEventListener('visibilitychange', onVisible);
    let liveChannel = null;
    const liveClient = getSupabaseClient();
    if (liveClient) {
      try {
        liveChannel = liveClient.channel(`live:${LIVE_TENANT_ID}`, { config: { broadcast: { self: false } } });
        liveChannel.on('broadcast', { event: 'changed' }, message => {
          const scope = message?.payload?.scope;
          if (!scope || scope === 'catalog' || scope === 'orders' || scope === 'therapists') refreshIfWatching();
        });
        liveChannel.subscribe();
      } catch {
        liveChannel = null;
      }
    }
    return () => {
      active = false;
      window.clearInterval(liveTimer);
      document.removeEventListener('visibilitychange', onVisible);
      if (liveChannel && liveClient) { try { liveClient.removeChannel(liveChannel); } catch { /* ignore */ } }
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
      setPromoState(current => ({ ...current, error: t('wall.promo.enterMobile') }));
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
        setPromoState({ discount: 0, phone: digits, loading: false, error: t('wall.promo.noDiscount') });
        return;
      }
      setPromoState({ discount: amount, phone: digits, loading: false, error: '' });
      // 号码带进下单表单,客人不用再填一遍
      const local = digits.startsWith('63') ? digits.slice(2) : digits.replace(/^0/, '');
      setEmailDraft(current => ({ ...current, phone: local }));
      setFormData(current => ({ ...current, phone: local }));
    } catch {
      setPromoState(current => ({ ...current, loading: false, error: t('wall.promo.failed') }));
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
        // 404 = 服务器明确说"这单不存在",跟 502/断网 是两回事,不能一起抹成 null。
        // 抹掉的后果:单被删的客人被永久拦住,下不了单也取消不掉(2026-08-04 老板踩到)。
        if (response.status === 404) return { ok: false, missing: true };
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
    setPhoneError(valid ? '' : t('errors.phoneInvalidForCountry'));
    return valid;
  };

  const handlePreferredDateChange = value => {
    const today = manilaToday();
    const preferredDate = value && value < today ? today : value;
    setDateError(value && value < today ? t('errors.pastDate') : '');
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
    // 2026-07-30 修:时间现在是在墙上、选技师之前定的,进详情不能清——清了客人
    // 就得选第二遍(老板实测抓到)。旧担心"带着 Ana 的 22:30 去约 Mia"仍有三道闸:
    // 墙只显示该时间能来的人 / 表单按新技师档期校验不合就地重选 / 后端下单硬校验。
    setAvailability({ status: 'idle', days: [], earliest: null });
    setError('');
    setStep('detail');
    // 漏斗眼睛(2026-07-28:169 进站 0 单,死在哪一步没人知道)——看了技师详情。
    // 这一步只带技师、不带金额:进详情时故意不预选服务(见上面注释),价格还没定,
    // 报个 0 会把 Meta 的均价学歪。带上技师是为了看"哪几个人最招客"。
    trackMetaEvent('ViewContent', {
      content_name: therapist?.name || '', content_ids: therapist?.id ? [therapist.id] : [], content_type: 'product'
    });
  };

  // 老板 2026-07-24:进详情页时滚回顶部——之前从列表滚下去点技师,详情会停在中间(价格)。
  useEffect(() => {
    if (step === 'detail') modalScrollRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const openTherapistDetail = therapistId => {
    // 约稍后必须先落定时间再选人(2026-07-30 老板拍板):不然走到表单还得再问一遍
    // "什么时候",客人觉得约了两次。没选时间就点 Book → 拉回顶部提示先选时间。
    if (scheduleMode === 'scheduled' && !scheduleSlot?.time) {
      setWallScheduleNudge(true);
      modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const therapist = findWebsiteTherapist(therapistId, bookingTherapists);
    if (!therapist) {
      setError(t('errors.profilesUnavailable'));
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
      setError(t('errors.profilesUnavailable'));
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
    // 漏斗眼睛——选好服务,进入邮箱步。
    // 2026-08-04 补金额:原来四个事件全是光秃秃的,Meta 只知道"有人点了",
    // 不知道值多少钱 → 学不出"高价单长什么样",也没法用"最大化转化价值"。
    trackMetaEvent('AddToCart', {
      value: selectedTotalAmount, currency: 'PHP',
      content_name: formData.service || '', content_ids: formData.serviceId ? [formData.serviceId] : [], content_type: 'product'
    });
  };

  // 2026-08-01 去邮箱:这一步只认手机号(必填有效),邮箱变成可有可无的历史字段。
  // 老客 session 里存过邮箱的照样带上,不白丢;新客一个邮箱都不用填。
  const handleEmailContinue = event => {
    event.preventDefault();
    const session = getDefaultBookingSession(emailDraft);
    const sessionPhone = normalizeBookingPhoneInput(session.phone, phoneCountry);
    const normalizedSession = {
      ...session,
      phone: session.phone ? formatBookingPhoneE164(sessionPhone.countryIso, sessionPhone.localNumber) : ''
    };
    if (!session.phone || !isValidBookingPhone(sessionPhone.countryIso, sessionPhone.localNumber)) {
      setError(t('errors.phoneInvalid'));
      return;
    }
    saveStoredSession(normalizedSession);
    setPhoneCountry(sessionPhone.countryIso);
    setFormData(current => ({ ...current, customerEmail: session.customerEmail, customerName: session.customerName || current.customerName, phone: sessionPhone.localNumber || current.phone }));
    setError('');
    setStep('details');
    // 进阶匹配(2026-08-04 老板拍板开):客人刚交出手机号,这是全流程最早能认人的一刻。
    // 必须赶在 Lead 之前调——fbq('init') 更新完认人字段,后面这一枪才带得上,
    // 顺序反了这条 Lead 就白瞎(只有 cookie,服务端的 Purchase 对不上同一个人)。
    identifyMetaUser({
      phone: normalizedSession.phone,
      email: session.customerEmail,
      name: session.customerName
    });
    // 漏斗眼睛——手机号填完了(2026-08-04 补)。
    // 017cc0f 那次照电商三件套(看商品/加购物车/去结账)埋,漏了这一步:我们比电商多
    // 一道"交出个人信息"的坎,而这正是最容易掉人的地方。原来"加入购物车→发起结账"
    // 之间掉了多少人只知道掉了,不知道卡在手机号还是卡在后面的姓名地址。
    // 用 Lead:Meta 对它的标准定义就是"用户留下了联系方式",跟这一步严丝合缝。
    trackMetaEvent('Lead', { value: selectedTotalAmount, currency: 'PHP', content_name: formData.service || '' });
  };

  const validateDetails = () => {
    if (!selectedTherapist) return t('errors.profilesUnavailable');
    if (!formData.service || !selectedServiceOption) return t('errors.selectDuration');
    // 2026-08-01 去邮箱:身份=手机号,邮箱不再是必填(下面的手机号校验才是身份闸)
    if (!formData.customerName.trim()) return t('errors.nameRequired');
    if (!formData.phone.trim()) {
      setPhoneError(t('errors.phoneInvalidForCountry'));
      return t('errors.phoneRequired');
    }
    if (!isValidBookingPhone(phoneCountry, formData.phone)) {
      setPhoneError(t('errors.phoneInvalidForCountry'));
      return t('errors.phoneInvalidForCountry');
    }
    setPhoneError('');
    // Area is still auto-derived from the address. The schedule is auto-stamped for
    // "as soon as possible" and explicitly chosen for "book for later".
    if (scheduleMode === 'scheduled' && !scheduleSlot?.time) {
      return availability.status === 'ready' && !availability.days.length
        ? t('errors.noOpenTimes')
        : t('errors.pickTime');
    }
    if (!formData.addressNote.trim()) return t('errors.addressRequired');
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
    const asapSlot = bookingIsScheduled ? null : manilaAsapSlot();
    const dispatchDate = bookingIsScheduled ? scheduleSlot.date : asapSlot.date;
    const dispatchTime = bookingIsScheduled ? scheduleSlot.time : asapSlot.time;
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
    trackMetaEvent('InitiateCheckout', {
      value: selectedTotalAmount, currency: 'PHP',
      content_name: formData.service || '', content_ids: formData.serviceId ? [formData.serviceId] : [], content_type: 'product'
    });
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
      setActiveCancelError(t('active.errors.contactRequired'));
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
      // 取消接口的 404 分不清"联系方式填错了"还是"这单根本没了"。
      // 别猜——拿状态接口再问一次,它答得明确。真没了 gate 会自己撕纸条、关弹窗;
      // 单还在就照旧提示填错。否则单被删的客人连取消这条自救路都堵死。
      await inspectStoredActiveBooking();
      if (!readActiveBooking()) {
        setActiveCancelConfirming(false);
        setActiveCancelContact('');
        return;
      }
      setActiveCancelError(t('active.errors.notVerified'));
      return;
    }
    setActiveCancelError(cancelErrorText(result, t));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const validationError = validateDetails();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (couponPreviewState !== 'ready') {
      setError(t('errors.waitCoupon'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    const requestPayload = buildBookingRequestPayload({ skipCoupon: couponOptOut });
    if (!requestPayload) {
      setIsSubmitting(false);
      setError(t('errors.selectDurationSubmit'));
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
      if (!guardedSubmission.ok) throw new Error(radiusMessageText(guardedSubmission.error, t));
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
          // 这个代码对应的英文是固定一句(publicBookingResponse.mjs),按代码换成当前语言
          const recoveryText = t('errors.recoveryPending');
          setError(recoveryText);
          showActiveBookingDialog(recoveryReference, {
            contactHint: formData.customerEmail || formData.phone,
            cancelToken: payload.cancelToken,
            persisted: Boolean(recoveryMarker),
            notice: payload.error ? recoveryText : payload.error
          });
          return;
        }
      }
      if (
        response.status === 409
        && (payload?.code === 'COUPON_PREVIEW_CHANGED' || payload?.code === 'COUPON_PREVIEW_REQUIRED')
      ) {
        setError(t('errors.couponChanged'));
        setCouponPreview(null);
        setCouponPreviewState('loading');
        await requestCouponPreview(couponOptOut);
        return;
      }
      if (
        response.status === 409
        && payload?.code === 'ACTIVE_BOOKING_EXISTS'
      ) {
        setError(t('errors.bookingExists'));
        return;
      }
      // 老板 2026-07-29 定的规矩:她接不了这个点,就当面说清楚 + 给下一步,
      // 绝不能像以前那样悄悄把订单改成别的时间(客人页面写 22:30、技师 19:30 敲门)。
      if (response.status === 409 && payload?.code === 'SCHEDULED_SLOT_UNAVAILABLE') {
        const therapistName = selectedTherapist?.name || t('common.thisTherapist');
        const earliest = payload.earliestDate && payload.earliestTime
          ? formatScheduleLabel(payload.earliestDate, payload.earliestTime, t)
          : '';
        const wanted = scheduleSlot?.time ? formatScheduleLabel(scheduleSlot.date, scheduleSlot.time, t) : t('errors.slot.thatTime');
        const slotMessageValues = { name: therapistName, wanted, earliest };
        setError(payload.reason === 'OFF_SHIFT'
          ? t(earliest ? 'errors.slot.offShiftEarliest' : 'errors.slot.offShift', slotMessageValues)
          : t(earliest ? 'errors.slot.justBookedEarliest' : 'errors.slot.justBooked', slotMessageValues));
        // Someone took the slot while this customer was typing — reload the real list.
        setScheduleSlot(null);
        setAvailabilityNonce(value => value + 1);
        setStep('details');
        return;
      }
      if (!response.ok || payload?.ok !== true) throw new Error(serverErrorText(payload, t('errors.submitFailed'), t));
      const reference = String(payload.reference || payload.bookingRequest?.id || '').trim();
      if (!/^mbr-brand-a-[a-z0-9]+$/i.test(reference)) {
        throw new Error(t('errors.notConfirmed'));
      }

      const activeBookingMarker = writeActiveBooking(reference, { cancelToken: payload.cancelToken });
      if (!activeBookingMarker) {
        setError(t('errors.credentialNotSaved'));
        showActiveBookingDialog(reference, {
          contactHint: formData.customerEmail || formData.phone,
          cancelToken: payload.cancelToken,
          persisted: false
        });
        return;
      }
      activeBookingInspectionSequenceRef.current += 1;
      // 像素旁路:官网下单成功打一个信号给 Meta(没配像素时静默)。
      // 2026-08-04 补金额+单号。
      // ⚠ eventID 是防**这一枪自己**被重复上报(客人刷新/重试/重渲染),不是跟服务端去重:
      //   服务端回传的是 Purchase(easygospa-ai/lib/conversionSweep.js),这里是 Schedule,
      //   Meta 按 event_name+event_id 配对去重,名字都不一样,本来就不会互相抵消。
      //   两边的 ID 也不是同一个(服务端用 EG-0803-004 这种短号,这里用 mbr-brand-a-xxx)——
      //   哪天要让两边认成同一笔,得先把 ID 口径统一,别以为现在已经通了。
      // 金额报服务原价:真正到手多少由服务端 Purchase 报
      // (我们是货到付款,下单这一刻钱还没收,浏览器这边不该说"已付款")。
      trackMetaEvent('Schedule', {
        value: selectedTotalAmount, currency: 'PHP',
        content_name: formData.service || '', content_ids: formData.serviceId ? [formData.serviceId] : [], content_type: 'product'
      }, { eventID: String(reference || '') });
      setIsOpen(false);
      router.push(`/track/${encodeURIComponent(reference)}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('errors.submitFailed'));
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
                  <button type="button" onClick={handleClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label={t('common.closeModal')}><ArrowLeft className="h-5 w-5 text-gray-600" /></button>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-xl font-bold text-[#171A17]">{t('wall.title')}</h2>
                    <p className="mt-1 inline-flex max-w-full items-center gap-1 text-xs font-bold text-[#55633F]" data-testid="therapist-area-label">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{t('wall.servingWithin', { km: MAX_SERVICE_DISTANCE_KM })}</span>
                    </p>
                  </div>
                  <button type="button" onClick={handleClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label={t('common.closeModal')}><X className="h-5 w-5 text-gray-700" /></button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-2xl bg-gray-100 px-3">
                    <Search className="h-4 w-4 shrink-0 text-gray-400" />
                    <input value={wallSearch} onChange={event => setWallSearch(event.target.value)} className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-gray-500" placeholder={t('wall.searchPlaceholder')} />
                  </div>
                </div>
                {/* 老板 2026-07-20:删掉区域下拉——我们只服务 10km 内,按区域名筛选没意义还会误导;
                    Service type 顶上原来的位置,排序保留 Nearby / Most booked。 */}
                <div className="mt-2.5 flex flex-nowrap items-center gap-2 overflow-x-auto" data-testid="booking-wall-filters">
                  <label className="sr-only" htmlFor="therapist-servicetype-filter">{t('wall.filterLabel')}</label>
                  <select
                    id="therapist-servicetype-filter"
                    value={serviceTypeFilter}
                    onChange={event => setServiceTypeFilter(event.target.value)}
                    data-testid="therapist-servicetype-filter"
                    className="h-10 shrink-0 rounded-full border border-gray-200 bg-white px-3.5 text-sm font-bold text-gray-700 outline-none focus:border-[#64734F]"
                  >
                    <option value={ALL_SERVICE_TYPES_VALUE}>{t('wall.serviceType')}</option>
                    {serviceTypeOptions.map(name => <option key={name} value={name}>{serviceLabel(name)}</option>)}
                  </select>
                  <button type="button" onClick={() => setWallSort('nearby')} aria-pressed={wallSort === 'nearby'} data-testid="wall-sort-nearby" className={`h-10 shrink-0 rounded-full border px-3.5 text-sm font-bold ${wallSort === 'nearby' ? 'border-[#64734F] bg-[#64734F] text-white' : 'border-gray-200 bg-white text-gray-700'}`}>{t('wall.sortNearby')}</button>
                  <button type="button" onClick={() => setWallSort('recommended')} aria-pressed={wallSort === 'recommended'} data-testid="wall-sort-popular" className={`h-10 shrink-0 rounded-full border px-3.5 text-sm font-bold ${wallSort === 'recommended' ? 'border-[#64734F] bg-[#64734F] text-white' : 'border-gray-200 bg-white text-gray-700'}`}>{t('wall.sortPopular')}</button>
                </div>
              </div>
            ) : step !== 'detail' ? (
              <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <button type="button" onClick={goBack} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label={t('common.back')}><ArrowLeft className="h-5 w-5 text-gray-600" /></button>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-[#171A17] sm:text-2xl">{t('header.title', { brand: BRAND_NAME })}</h2>
                    <p className="text-sm text-gray-500">{t('header.subtitle')}</p>
                  </div>
                </div>
                <button type="button" onClick={handleClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label={t('common.closeModal')}><X className="h-5 w-5 text-gray-600" /></button>
              </div>
            ) : null}

            <div ref={modalScrollRef} className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5" data-testid="booking-modal">

              {error ? <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

              {step === 'wall' ? (
                <div className="space-y-2">
                  {/* 2026-07-30 老板拍板:预约入口上墙,第一眼可见。默认仍是"马上来"零打扰;
                      选"约稍后"才展开时间条,选了时间就按排班过滤墙上的技师。 */}
                  <div className={`mx-1 rounded-[1.5rem] border bg-white p-3 ${wallScheduleNudge ? 'border-amber-400 ring-4 ring-amber-200/60' : 'border-gray-200'}`} data-testid="wall-schedule-bar">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setScheduleMode('asap'); setScheduleSlot(null); setWallScheduleNudge(false); }}
                        aria-pressed={scheduleMode === 'asap'}
                        data-testid="wall-schedule-now"
                        className={`h-10 flex-1 rounded-full border text-sm font-bold transition ${scheduleMode === 'asap' ? 'border-[#64734F] bg-[#64734F] text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-[#64734F]'}`}
                      >{t('wall.now')}</button>
                      <button
                        type="button"
                        onClick={() => setScheduleMode('scheduled')}
                        aria-pressed={scheduleMode === 'scheduled'}
                        data-testid="wall-schedule-later"
                        className={`h-10 flex-1 rounded-full border text-sm font-bold transition ${scheduleMode === 'scheduled' ? 'border-[#64734F] bg-[#64734F] text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-[#64734F]'}`}
                      >{t('wall.later')}</button>
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
                                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${active ? 'border-[#64734F] bg-[#F2F4EC] text-[#55633F]' : 'border-gray-300 bg-white text-gray-700 hover:border-[#64734F]'}`}
                              >{manilaDayLabel(dateKey, offset, t, locale)}</button>
                            );
                          })}
                          <select
                            value={scheduleSlot?.time || ''}
                            onChange={event => { setScheduleSlot({ date: scheduleSlot?.date || manilaToday(), time: event.target.value }); if (event.target.value) setWallScheduleNudge(false); }}
                            data-testid="wall-schedule-time"
                            aria-label={t('wall.pickTimeAria')}
                            className="h-9 rounded-full border border-gray-300 bg-white px-3 text-sm font-bold text-gray-700 outline-none focus:border-[#64734F]"
                          >
                            <option value="">{t('wall.pickTimeOption')}</option>
                            {timeSlots.filter(time => isSelectableManilaTime(scheduleSlot?.date || manilaToday(), time)).map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                        {!scheduleSlot?.time ? (
                          <p className={wallScheduleNudge ? 'text-xs font-bold text-amber-700' : 'text-xs font-medium text-gray-500'} data-testid="wall-schedule-hint">
                            {wallScheduleNudge ? t('wall.pickTimeFirst') : t('wall.pickDayHint')}
                          </p>
                        ) : wallTimeMatch.status === 'loading' ? (
                          <p className="text-xs font-medium text-gray-500">{t('wall.checkingWho', { when: formatScheduleLabel(scheduleSlot.date, scheduleSlot.time, t) })}</p>
                        ) : wallTimeMatch.status === 'failed' ? (
                          <p className="text-xs font-semibold text-amber-700" data-testid="wall-schedule-check-failed">{t('wall.checkFailed')}</p>
                        ) : wallTimeMatch.status === 'ready' ? (
                          <p className="text-xs font-semibold text-[#55633F]" data-testid="wall-schedule-match-note">{t('wall.showingFreeAt', { when: formatScheduleLabel(scheduleSlot.date, scheduleSlot.time, t) })}</p>
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
                      className="mx-1 rounded-[1.5rem] border border-[#64734F]/30 bg-[#F2F4EC] p-4"
                      data-testid="wall-promo-phone"
                      onSubmit={submitWallPromoPhone}
                    >
                      <p className="text-sm font-bold text-[#55633F]">
                        {t('wall.promo.title', { amount: money(promoCampaign.amount) })}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-600">
                        {t('wall.promo.body')}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <input
                          autoComplete="tel"
                          className="h-11 min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 font-medium text-[#171A17] focus:border-[#64734F] focus:outline-none"
                          inputMode="tel"
                          onChange={event => setWallPromoPhone(event.target.value)}
                          placeholder="09XX XXX XXXX"
                          type="tel"
                          value={wallPromoPhone}
                        />
                        <button
                          className="h-11 shrink-0 rounded-xl bg-[#64734F] px-5 text-sm font-bold text-white disabled:opacity-60"
                          disabled={promoState.loading}
                          type="submit"
                        >
                          {promoState.loading ? '...' : t('wall.promo.apply')}
                        </button>
                      </div>
                      {promoState.error ? <p className="mt-2 text-xs font-semibold text-[#B4463C]">{promoState.error}</p> : null}
                    </form>
                  ) : null}
                  {promoState.discount > 0 ? (
                    <div className="mx-1 flex items-center justify-between gap-3 rounded-full border border-[#64734F]/30 bg-[#F2F4EC] px-4 py-2" data-testid="wall-promo-applied">
                      <p className="truncate text-sm font-bold text-[#55633F]">
                        {t('wall.promo.applied', { amount: money(promoState.discount) })}
                      </p>
                    </div>
                  ) : null}
                  {/* 老板 2026-07-24:定位确认后收成一条细条(大地图默认藏),别霸屏挡技师;
                      点"Adjust"才展开地图改 pin。未设定位时才给完整提示面板。 */}
                  {isUsableCustomerLocation(customerCoords) && !showWallLocationPicker ? (
                    <div className="mx-1 flex items-center justify-between gap-3 rounded-full border border-[#64734F]/25 bg-[#E9ECE1] px-4 py-2" data-testid="wall-location-entry">
                      <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold text-[#55633F]"><MapPin className="h-4 w-4 shrink-0" />{t('wall.location.confirmed')}</p>
                      <button type="button" onClick={() => setShowWallLocationPicker(true)} data-testid="wall-location-entry-toggle" className="shrink-0 text-sm font-bold text-[#55633F] underline underline-offset-2">{t('wall.location.adjust')}</button>
                    </div>
                  ) : (
                    <div className="mx-1 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4" data-testid="wall-location-entry">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="min-w-0 flex-1 text-sm font-semibold text-amber-900">{isUsableCustomerLocation(customerCoords) ? t('wall.location.adjustPin') : t('wall.location.share')}</p>
                        <button
                          type="button"
                          onClick={() => setShowWallLocationPicker(current => !current)}
                          data-testid="wall-location-entry-toggle"
                          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#64734F] px-4 text-sm font-bold text-white transition hover:bg-[#55633F]"
                        >
                          <MapPin className="h-4 w-4" />{showWallLocationPicker ? t('wall.location.hideMap') : t('wall.location.setLocation')}
                        </button>
                      </div>
                      {showWallLocationPicker ? (
                        <div className="mt-3" data-testid="wall-location-picker">
                          <LocationPicker value={formData.customerLocation} onChange={handleWallLocationChange} onAddress={handleResolvedAddress} />
                        </div>
                      ) : null}
                    </div>
                  )}
                  {catalogStatus === 'ready' ? <p className="px-1 text-sm font-semibold text-gray-600" data-testid="therapist-result-count">{scheduleMode === 'scheduled' && wallTimeMatch.status === 'ready' && wallTimeMatch.requested
                    ? t('wall.resultCountAt', { count: wallTherapistsForTime.length, when: formatScheduleLabel(wallTimeMatch.requested.date, wallTimeMatch.requested.time, t) })
                    : t('wall.resultCount', { count: wallTherapistsForTime.length })}</p> : null}
                  <div className="grid gap-3 px-1 pb-6 sm:grid-cols-2" data-testid="booking-therapist-list">
                    {catalogStatus === 'loading' ? (
                      <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 text-sm text-gray-700" data-testid="booking-catalog-loading">
                        <p className="font-bold text-[#171A17]">{t('wall.loadingTitle')}</p>
                        <p className="mt-1">{t('wall.loadingBody')}</p>
                      </div>
                    ) : null}
                    {catalogStatus === 'ready' ? wallTherapistsForTime.map(therapist => <TherapistWallCard key={therapist.id} therapist={therapist} selected={formData.requestedTechnicianId === therapist.id} onSelect={openTherapistDetail} onRequireLocation={() => setShowWallLocationPicker(true)} customerLocated={isUsableCustomerLocation(customerCoords)} />) : null}
                    {catalogUnavailable ? (
                      <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" data-testid="booking-catalog-unavailable">
                        <p className="text-base font-bold">{t('wall.unavailableTitle')}</p>
                        <p className="mt-2 text-sm">{t('wall.unavailableBody')}</p>
                      </div>
                    ) : null}
                    {catalogStatus === 'error' ? (
                      <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm text-red-900" data-testid="booking-catalog-error">
                        <p className="text-base font-bold">{t('wall.errorTitle')}</p>
                        <p className="mt-2">{t('wall.errorBody')}</p>
                        
                      </div>
                    ) : null}
                    {catalogStatus === 'ready' && hasSpecificTherapists && wallTherapistsForTime.length === 0 ? (
                      scheduleMode === 'scheduled' && wallTimeMatch.status === 'ready' && wallTherapists.length > 0 ? (
                        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" data-testid="booking-time-no-results">
                          <p className="font-bold">{wallTimeMatch.requested ? t('wall.noneFreeAt', { when: formatScheduleLabel(wallTimeMatch.requested.date, wallTimeMatch.requested.time, t) }) : t('wall.noneFreeThatTime')}</p>
                          <p className="mt-1">{t.rich('wall.noneFreeHint', { b: strong })}</p>
                        </div>
                      ) : (
                        <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 text-sm text-gray-600" data-testid="booking-search-no-results"><p className="font-bold text-[#171A17]">{t('wall.noMatchTitle')}</p><p className="mt-1">{t('wall.noMatchBody')}</p></div>
                      )
                    ) : null}
                  </div>
                </div>
              ) : null}

              {step === 'detail' && selectedTherapist ? <TherapistDetail therapist={selectedTherapist} availableServices={availableServices} selectedServiceName={formData.service} selectedDuration={Number(formData.durationMinutes)} totalAmount={selectedTotalAmount} onSelectService={handleSelectService} onSelectDuration={handleSelectDuration} onBack={() => setStep('wall')} onBook={handleBookSelection} promoDiscount={promoState.discount} /> : null}

              {step === 'email' ? (
                /* 2026-08-01 老板拍板:去邮箱。菲律宾普通人日常不用邮箱,这一步曾是
                   加购后最大的流失点(选好服务→被要邮箱→走人)。手机号就是身份:
                   券按它发、订单按它查、确认走 WhatsApp。邮箱字段整个拿掉。 */
                <form onSubmit={handleEmailContinue} className="space-y-5">
                  <div>
                    <h3 className="text-2xl font-bold text-[#171A17]">{t('phone.title')}</h3>
                    <p className="mt-2 text-sm text-gray-600">{t('phone.body')}</p>
                  </div>
                  <div className={summaryCardClass}>
                    <div className="flex justify-between gap-4"><span className={summaryLabelClass}>{t('common.therapist')}</span><strong className={summaryValueClass}>{selectedTherapist.name}</strong></div>
                    <div className="mt-2 flex justify-between gap-4"><span className={summaryLabelClass}>{t('common.service')}</span><strong className={summaryValueClass}>{t('common.serviceDuration', { service: serviceLabel(formData.service), minutes: formData.durationMinutes })}</strong></div>
                    <div className="mt-2 flex justify-between gap-4"><span className={summaryLabelClass}>{t('common.total')}</span><PriceWithDiscount amount={selectedTotalAmount} discount={promoState.discount} mainClassName={summaryMoneyClass} /></div>
                  </div>
                  {/* ⚠ 2026-07-29 老板拍板:优惠直接挂在手机号这一格。
                      客人不知道为什么要填手机号,给他一个理由 —— 而且这句话
                      就是广告承诺的兑现点,必须出现在他填号码的那一刻。 */}
                  <div>
                    <label className={bookingLabelClass}><Phone className="mr-2 inline h-4 w-4" />{t('common.phoneLabel')}</label>
                    <p className="-mt-2 mb-2 text-xs font-bold leading-5 text-[#55633F]">
                      {t('phone.firstBookingHint', { amount: '₱150' })}
                    </p>
                    <div className="flex gap-2">
                      <select aria-label={t('common.phoneCountry')} className="h-12 w-[8.25rem] shrink-0 rounded-2xl border border-gray-300 bg-white px-3 text-sm font-bold text-[#171A17] focus:border-[#64734F] focus:outline-none" value={phoneCountry} onChange={event => setPhoneCountry(event.target.value)}>
                        {BOOKING_PHONE_COUNTRIES.map(country => <option key={country.iso} value={country.iso}>{country.flag} +{country.callingCode}</option>)}
                      </select>
                      <div className="relative min-w-0 flex-1">
                        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-gray-500">+{bookingPhoneCountry(phoneCountry).callingCode}</span>
                        <input autoComplete="tel-national" className={`${bookingInputClass} pl-14`} inputMode="tel" value={emailDraft.phone} onChange={event => setEmailDraft(current => ({ ...current, phone: event.target.value }))} placeholder="908 123 4567" data-testid="booking-phone" data-readability-field="phone" required />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={bookingLabelClass}>{t('phone.nameLabel')}</label>
                    <input className={bookingInputClass} value={emailDraft.name} onChange={event => setEmailDraft(current => ({ ...current, name: event.target.value }))} placeholder={t('phone.namePlaceholder')} data-readability-field="customerName" />
                  </div>
                  <button type="submit" className="h-12 w-full rounded-2xl bg-[#64734F] px-6 font-bold text-white hover:bg-[#55633F]">{t('common.continue')}</button>
                </form>
              ) : null}

              {step === 'details' ? (
                <form onSubmit={handleDetailsContinue} className="space-y-5">
                  <div>
                    <h3 className="text-2xl font-bold text-[#171A17]">{t('details.title')}</h3>
                    <p className="mt-2 text-sm text-gray-600">{t('details.body')}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={bookingLabelClass}><User className="mr-2 inline h-4 w-4" />{t('details.fullName')}</label>
                      <input className={bookingInputClass} value={formData.customerName} onChange={event => updateField('customerName', event.target.value)} placeholder={t('details.fullNamePlaceholder')} data-readability-field="customerName" required />
                    </div>
                    <div>
                      <label className={bookingLabelClass}><Phone className="mr-2 inline h-4 w-4" />{t('common.phoneLabel')}</label>
                      <div className="flex gap-2">
                        <select aria-label={t('common.phoneCountry')} className="h-12 w-[8.25rem] shrink-0 rounded-2xl border border-gray-300 bg-white px-3 text-sm font-bold text-[#171A17] focus:border-[#64734F] focus:outline-none" value={phoneCountry} onChange={event => { setPhoneCountry(event.target.value); setPhoneError(''); }}>
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
                    onChangeOnWall={() => { if (error) setError(''); setStep('wall'); }}
                    slot={scheduleSlot}
                    onSlotChange={slot => { setScheduleSlot(slot.time ? slot : { date: slot.date, time: '' }); if (error) setError(''); }}
                    days={availability.days}
                    loading={availability.status === 'loading'}
                    loadFailed={availability.status === 'failed'}
                    earliestLabel={availability.earliest ? formatScheduleLabel(availability.earliest.dateKey, availability.earliest.time, t) : ''}
                    therapistName={selectedTherapist?.name || ''}
                  />
                  <div className={addressFeedback === 'success' ? 'rounded-2xl ring-4 ring-[#64734F]/20 transition' : 'transition'} data-location-address-feedback={addressFeedback || undefined} ref={addressFieldRef}>
                    <label className={bookingLabelClass}><MapPin className="mr-2 inline h-4 w-4" />{t('details.addressLabel')}</label>
                    <p className="mb-2 text-xs text-gray-500">{t('details.addressHint')}</p>
                    <AddressAutocompleteInput
                      value={formData.addressNote}
                      inputClassName={`${bookingInputClass} ${addressFeedback === 'success' ? 'border-[#64734F] bg-[#F2F4EC]' : ''}`}
                      placeholder={t('details.addressPlaceholder')}
                      onTextChange={text => { setAddressFeedback(''); updateField('addressNote', text); }}
                      onLocationResolved={updateCustomerLocation}
                    />
                    {addressFeedback === 'error' ? <p className="mt-2 text-xs font-semibold text-amber-700">{t('location.addressFetchFailed')}</p> : null}
                  </div>
                  <div>
                    <label className={bookingLabelClass}><MapPin className="mr-2 inline h-4 w-4" />{t.rich('details.pinLabel', { hint: chunks => <span className="font-normal text-gray-500">{chunks}</span> })}</label>
                    <p className="mb-2 text-xs text-gray-500">{t('details.pinHint')}</p>
                    <LocationPicker value={formData.customerLocation} onChange={updateCustomerLocation} onAddress={handleResolvedAddress} />
                  </div>
                  <div>
                    <label className={bookingLabelClass}><MessageSquare className="mr-2 inline h-4 w-4" />{t('details.notesLabel')}</label>
                    <textarea className={bookingTextareaClass} rows={3} value={formData.notes} onChange={event => updateField('notes', event.target.value)} placeholder={t('details.notesPlaceholder')} data-readability-field="notes" />
                  </div>
                  <button type="submit" data-testid="review-cash-booking" className="h-12 w-full rounded-2xl bg-[#64734F] px-6 font-bold text-white hover:bg-[#55633F]">{t('details.review')}</button>
                </form>
              ) : null}

              {step === 'confirm' ? (
                <form onSubmit={handleSubmit} className="space-y-5" data-testid="confirm-step">
                  <div>
                    <h3 className="text-2xl font-bold text-[#171A17]">{t('confirm.title')}</h3>
                    <p className="mt-2 text-sm text-gray-600">{t('confirm.body')}</p>
                  </div>
                  <div className={summaryCardClass}>
                    <div className="grid gap-3">
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>{t('common.therapist')}</strong><span className={summaryValueClass}>{selectedTherapist.name}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>{t('common.service')}</strong><span className={summaryValueClass}>{t('common.serviceDuration', { service: serviceLabel(formData.service), minutes: formData.durationMinutes })}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>{t('confirm.schedule')}</strong><span className={summaryValueClass} data-testid="confirm-schedule">{scheduleMode === 'scheduled' && scheduleSlot?.time
                        ? formatScheduleLabel(scheduleSlot.date, scheduleSlot.time, t)
                        : t('confirm.asap')}</span></div>
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>{t('confirm.address')}</strong><span className={summaryValueClass}>{inferAreaFromAddress(formData.addressNote)} - {formData.addressNote}</span></div>
                      <BookingCouponAmounts couponPreview={couponPreview} selectedTotalAmount={selectedTotalAmount} promoDiscount={promoState.discount} />
                      <div className="flex justify-between gap-4"><strong className={summaryLabelClass}>{t('confirm.payment')}</strong><span className={summaryValueClass}>{t('confirm.cashBeforeService')}</span></div>
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
                  <button type="submit" disabled={isSubmitting || couponPreviewState !== 'ready'} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#64734F] px-6 font-bold text-white hover:bg-[#55633F] disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{t('confirm.submitting')}</> : t('confirm.submit')}
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
                <h2 id="active-booking-dialog-title" className="mt-4 text-2xl font-bold text-[#171A17]">{t('active.title')}</h2>
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
                        className="h-12 rounded-2xl bg-[#64734F] px-4 font-bold text-white transition hover:bg-[#55633F]"
                      >
                        {t('active.view')}
                      </button>
                    ) : (
                      <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                        {t('active.notSaved')}
                      </p>
                    )}
                    <button type="submit" className="h-12 rounded-2xl border border-red-200 bg-white px-4 font-bold text-red-700 transition hover:bg-red-50">
                      {t('active.cancelBooking')}
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <p className="text-sm leading-6 text-gray-600">{t('active.confirmIntro')}</p>
                    <div>
                      <label htmlFor="active-booking-contact" className={bookingLabelClass}>{t('active.contactLabel')}</label>
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
                        {t('active.keep')}
                      </button>
                      <button type="submit" disabled={activeCancelPending} className="h-12 rounded-2xl bg-red-600 px-4 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {activeCancelPending ? t('active.cancelling') : t('active.confirmCancel')}
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
                <h2 id="resting-therapist-warning-title" className="mt-4 text-2xl font-bold text-[#171A17]">{t('resting.title')}</h2>
                {findWebsiteTherapist(pendingRestingTherapistId, bookingTherapists)?.technicianAccountId ? (
                  <>
                    <p className="mt-3 text-sm leading-6 text-gray-600">{t('resting.body')}</p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <button type="button" onClick={cancelRestingTherapistSelection} className="h-12 rounded-2xl border border-gray-200 bg-white px-4 font-bold text-gray-700 transition hover:bg-gray-50">
                        {t('common.cancel')}
                      </button>
                      <button type="button" onClick={continueRestingTherapistSelection} className="h-12 rounded-2xl bg-[#64734F] px-4 font-bold text-white transition hover:bg-[#55633F]">
                        {t('resting.continueAnyway')}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm leading-6 text-gray-600">{t('resting.notAccepting')}</p>
                    <div className="mt-6">
                      <button type="button" onClick={cancelRestingTherapistSelection} className="h-12 w-full rounded-2xl bg-[#64734F] px-4 font-bold text-white transition hover:bg-[#55633F]">
                        {t('resting.chooseAnother')}
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
