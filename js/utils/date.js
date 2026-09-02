const DAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getMondayOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDays(date = new Date()) {
  const monday = getMondayOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function formatDateEditorial(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS_TR[date.getMonth()].toUpperCase();
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDayLabel(date) {
  return DAYS_TR[date.getDay()];
}

export function formatDayShort(date) {
  const day = date.getDay();
  const index = day === 0 ? 6 : day - 1;
  return DAYS_SHORT[index];
}

export function formatDayDate(date) {
  return `${date.getDate()} ${MONTHS_TR[date.getMonth()].slice(0, 3)}`;
}

export function isSameDay(a, b) {
  return toDateKey(a) === toDateKey(b);
}

export function isToday(date) {
  return isSameDay(date, new Date());
}

export function formatWeekRange(date = new Date()) {
  const days = getWeekDays(date);
  const start = days[0];
  const end = days[6];
  const startStr = `${start.getDate()} ${MONTHS_TR[start.getMonth()].toLowerCase()}`;
  const endStr = `${end.getDate()} ${MONTHS_TR[end.getMonth()].toLowerCase()}`;
  return `${startStr} – ${endStr}`;
}

export function getWeekKey(date = new Date()) {
  return toDateKey(getMondayOfWeek(date));
}

export function isDateKeyInCurrentWeek(dateKey, date = new Date()) {
  const weekKeys = getWeekDays(date).map(toDateKey);
  return weekKeys.includes(dateKey);
}
