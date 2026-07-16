import assert from 'node:assert/strict';
import fs from 'node:fs';

function check(condition, message) {
  assert.ok(condition, message);
  console.log(`[website-booking-readability] PASS ${message}`);
}

const source = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');

check(source.includes('const bookingInputClass'), 'BookingModal defines shared readable input class');
check(source.includes('text-[#0F0F0F]') && source.includes('placeholder:text-gray-500'), 'input values are darker than placeholders');
check(source.includes('const bookingLabelClass'), 'BookingModal defines shared readable label class');
check(source.includes('const summaryLabelClass') && source.includes('const summaryValueClass'), 'BookingModal separates summary label and value color');
check(source.includes('text-slate-700') && source.includes('text-[#0F0F0F]'), 'summary labels and values use readable contrast');

// preferredDate/preferredTime/area inputs were removed by the instant-booking design;
// the address input now lives inside AddressAutocompleteInput.
for (const field of ['booking-email', 'customerName', 'phone', 'notes']) {
  check(source.includes(`data-readability-field="${field}"`), `${field} field has readability marker`);
}

const addressInputSource = fs.readFileSync('src/components/AddressAutocompleteInput.jsx', 'utf8');
check(addressInputSource.includes('data-readability-field="addressNote"'), 'addressNote field has readability marker (AddressAutocompleteInput)');

for (const label of ['Therapist', 'Service', 'Date/time', 'Address', 'Total', 'Payment', 'Booking reference', 'Selected therapist', 'Selected service', 'Total amount']) {
  check(source.includes(label), `${label} summary label remains visible`);
}

check(!/text-white[^'"]*\{selectedTherapist\.name\}/.test(source), 'confirm summary does not render value as white text');
check(!/text-white[^'"]*\{createdAppointment\?\./.test(source), 'success summary does not render value as white text');
