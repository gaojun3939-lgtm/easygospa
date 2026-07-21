const LOCATION_CONFIRMATION_ACTIONS = new Set(['gps', 'pin']);

export function confirmedLocationAction(action = '') {
  const normalized = String(action || '').trim();
  return LOCATION_CONFIRMATION_ACTIONS.has(normalized) ? normalized : '';
}

export function resetLocationConfirmation() {
  return '';
}

export function resolvedAddressAfterConfirmation(currentAddress = '', resolvedAddress = '') {
  const resolved = String(resolvedAddress || '').trim();
  return resolved || String(currentAddress || '');
}
