// All "today / now" calculations use Dominican Republic local time (UTC-4, no DST)
const TZ = 'America/Santo_Domingo'

// Return YYYY-MM-DD string for an instant, evaluated in DR local time
export function toISODate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date)
}

export function todayISO() {
  return toISODate(new Date())
}

export function formatDate(isoDate) {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.split('-')
  return `${m}/${d}/${y}`
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { timeZone: TZ })
}

export function daysBetween(isoA, isoB) {
  // Work purely with date strings — no timezone ambiguity
  const a = new Date(isoA + 'T12:00:00')
  const b = new Date(isoB + 'T12:00:00')
  return Math.round((b - a) / 86400000)
}

export function daysUntil(isoDate) {
  return daysBetween(todayISO(), isoDate)
}

export function isMonday(isoDate = todayISO()) {
  return new Date(isoDate + 'T12:00:00').getDay() === 1
}

export function isWednesday(isoDate = todayISO()) {
  return new Date(isoDate + 'T12:00:00').getDay() === 3
}

export function getWeekStart(isoDate = todayISO()) {
  const d = new Date(isoDate + 'T12:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getMonthRange(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  // Last day: day 0 of next month
  const last = new Date(year, month, 0)
  const end = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  return { start, end }
}

export function thisWeekDates() {
  const start = getWeekStart()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start + 'T12:00:00')
    d.setDate(d.getDate() + i)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
}

export function last30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    // Shift d back (29-i) days, then read DR local date
    d.setDate(d.getDate() - (29 - i))
    return toISODate(d)
  })
}

export function monthLabel(isoDate) {
  const [y, m] = isoDate.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short', year: '2-digit' })
}

export function isoToMs(iso) {
  return new Date(iso + 'T12:00:00').getTime()
}
