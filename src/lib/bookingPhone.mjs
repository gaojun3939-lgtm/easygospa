export const DEFAULT_BOOKING_PHONE_COUNTRY = 'PH';

export const BOOKING_PHONE_COUNTRIES = Object.freeze([
  { iso: 'PH', name: 'Philippines', flag: '🇵🇭', callingCode: '63' },
  { iso: 'US', name: 'United States', flag: '🇺🇸', callingCode: '1' },
  { iso: 'CN', name: 'China', flag: '🇨🇳', callingCode: '86' },
  { iso: 'KR', name: 'South Korea', flag: '🇰🇷', callingCode: '82' },
  { iso: 'JP', name: 'Japan', flag: '🇯🇵', callingCode: '81' },
  { iso: 'SG', name: 'Singapore', flag: '🇸🇬', callingCode: '65' },
  { iso: 'AU', name: 'Australia', flag: '🇦🇺', callingCode: '61' },
  { iso: 'GB', name: 'United Kingdom', flag: '🇬🇧', callingCode: '44' },
  { iso: 'CA', name: 'Canada', flag: '🇨🇦', callingCode: '1' },
  { iso: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', callingCode: '971' }
]);

export function bookingPhoneCountry(iso = DEFAULT_BOOKING_PHONE_COUNTRY) {
  return BOOKING_PHONE_COUNTRIES.find(country => country.iso === iso) || BOOKING_PHONE_COUNTRIES[0];
}

function phoneDigits(value = '') {
  return String(value || '').replace(/\D/g, '');
}

function localDigits(value = '') {
  return phoneDigits(value).replace(/^0+/, '');
}

export function normalizeBookingPhoneInput(value = '', selectedIso = DEFAULT_BOOKING_PHONE_COUNTRY) {
  const raw = String(value || '').trim();
  const selected = bookingPhoneCountry(selectedIso);
  const international = raw.startsWith('+') || raw.startsWith('00');
  const digits = phoneDigits(international && raw.startsWith('00') ? raw.slice(2) : raw);
  if (!international) return { countryIso: selected.iso, localNumber: localDigits(digits) };

  const byLongestCode = [...BOOKING_PHONE_COUNTRIES].sort((left, right) => right.callingCode.length - left.callingCode.length);
  const matchingSelected = digits.startsWith(selected.callingCode) ? selected : null;
  const detected = matchingSelected || byLongestCode.find(country => digits.startsWith(country.callingCode)) || selected;
  const withoutCallingCode = digits.startsWith(detected.callingCode) ? digits.slice(detected.callingCode.length) : digits;
  return { countryIso: detected.iso, localNumber: localDigits(withoutCallingCode) };
}

export function formatBookingPhoneE164(countryIso = DEFAULT_BOOKING_PHONE_COUNTRY, value = '') {
  const country = bookingPhoneCountry(countryIso);
  const localNumber = localDigits(value);
  return localNumber ? `+${country.callingCode}${localNumber}` : '';
}

export function isValidBookingPhone(countryIso = DEFAULT_BOOKING_PHONE_COUNTRY, value = '') {
  const localNumber = localDigits(value);
  if (bookingPhoneCountry(countryIso).iso === 'PH') return /^9\d{9}$/.test(localNumber);
  const e164Digits = formatBookingPhoneE164(countryIso, localNumber).slice(1);
  return localNumber.length >= 6 && e164Digits.length >= 8 && e164Digits.length <= 15;
}
