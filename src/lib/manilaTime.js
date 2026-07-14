const manilaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const manilaTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
});

export function manilaToday() {
  return manilaDateFormatter.format(new Date());
}

export function manilaNowMinutes() {
  const parts = manilaTimeFormatter.formatToParts(new Date());
  const hour = Number(parts.find(part => part.type === 'hour')?.value || 0);
  const minute = Number(parts.find(part => part.type === 'minute')?.value || 0);
  return (hour * 60) + minute;
}
