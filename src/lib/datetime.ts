/**
 * تنسيقات التاريخ والوقت المستخدمة في العقود وعروض الأسعار.
 *
 * القيم تُخزَّن دائماً بصيغة قابلة للفرز:
 *   • التاريخ: YYYY-MM-DD
 *   • الوقت:   HH:mm  (٢٤ ساعة)
 * والعرض للمستخدم يتم بالعربية.
 */

export const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
] as const

/** أيام الأسبوع مختصرة — تبدأ من الأحد كما هو معتاد في السعودية */
export const AR_WEEKDAYS_SHORT = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'] as const

/**
 * YYYY-MM-DD في التوقيت المحلي. toISOString() يعطي توقيت UTC، فيرجع تاريخ الأمس
 * لأي سجل يُنشأ بعد منتصف الليل بتوقيت الرياض (UTC+3).
 */
export const localISO = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

export const todayISO = () => localISO(new Date())

export const inDays = (n: number) => localISO(new Date(Date.now() + n * 86400000))

/** 2026-09-06 → 06 / 09 / 2026م */
export const arDate = (iso: string) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d} / ${m} / ${y}م`
}

/** 2026-09-06 → 6 سبتمبر 2026 */
export const arDateLong = (iso: string) => {
  const p = parseISODate(iso)
  if (!p) return iso ?? ''
  return `${p.getDate()} ${AR_MONTHS[p.getMonth()]} ${p.getFullYear()}`
}

/** "2026-09-06" → Date محلي، أو null إن كانت القيمة غير صالحة */
export function parseISODate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * يقرأ الوقت بأي صيغة معقولة ويعيده كـ { h, m } بنظام ٢٤ ساعة.
 * يقبل: "14:30"، "2:30 مساءً"، "2:30 PM"، "٢:٣٠ مساءً" — ويعيد null لما عداها.
 */
export function parseTime(value: string | null | undefined): { h: number; m: number } | null {
  if (!value) return null

  // تحويل الأرقام العربية الهندية إلى لاتينية
  const normalized = value
    .trim()
    .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, d => String(d.charCodeAt(0) - 0x06f0))

  const m = /(\d{1,2})\s*[:.]\s*(\d{2})/.exec(normalized)
  if (!m) return null

  let h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null

  const pm = /مساء|م\.?\s*$|\bp\.?m\.?/i.test(normalized)
  const am = /صباح|ص\.?\s*$|\ba\.?m\.?/i.test(normalized)
  if (pm && h < 12) h += 12
  if (am && h === 12) h = 0

  return { h, m: min }
}

/** { h: 14, m: 30 } → "14:30" */
export const toHHmm = (h: number, m: number) =>
  `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

/** "14:30" → "٢:٣٠ مساءً" بالأرقام اللاتينية: "2:30 مساءً" */
export function arTime(value: string | null | undefined): string {
  const t = parseTime(value)
  if (!t) return (value ?? '').trim() // قيمة قديمة مكتوبة يدوياً — تُعرض كما هي
  const period = t.h < 12 ? 'صباحاً' : 'مساءً'
  const h12 = t.h % 12 === 0 ? 12 : t.h % 12
  return `${h12}:${String(t.m).padStart(2, '0')} ${period}`
}
