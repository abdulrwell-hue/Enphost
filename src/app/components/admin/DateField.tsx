import { useEffect, useMemo, useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import FieldPopover from './FieldPopover'
import {
  AR_MONTHS, AR_WEEKDAYS_SHORT, arDateLong, localISO, parseISODate, todayISO,
} from '../../../lib/datetime'

interface Props {
  /** التاريخ بصيغة YYYY-MM-DD — أو '' إن لم يُحدَّد */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** إخفاء زر المسح للحقول الإلزامية */
  clearable?: boolean
  disabled?: boolean
}

const YEAR_SPAN = 6 // ± حول السنة الحالية في قائمة السنوات

/** كل الخلايا الظاهرة في شبكة الشهر — مع أيام الشهرين المجاورين لإكمال الأسابيع */
function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay()) // نرجع لأقرب أحد
  return Array.from({ length: 42 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
}

export default function DateField({
  value, onChange, placeholder = 'اختر التاريخ', clearable = true, disabled = false,
}: Props) {
  const [open, setOpen] = useState(false)

  const selected = parseISODate(value)
  const today = todayISO()

  // الشهر المعروض في اللوحة — يتبع القيمة المختارة عند كل فتح
  const [cursor, setCursor] = useState(() => selected ?? new Date())
  useEffect(() => {
    if (open) setCursor(parseISODate(value) ?? new Date())
  }, [open, value])

  const days = useMemo(
    () => monthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  )

  const years = useMemo(() => {
    const base = new Date().getFullYear()
    const from = Math.min(base - YEAR_SPAN, cursor.getFullYear())
    const to = Math.max(base + YEAR_SPAN, cursor.getFullYear())
    return Array.from({ length: to - from + 1 }, (_, i) => from + i)
  }, [cursor])

  function pick(d: Date) {
    onChange(localISO(d))
    setOpen(false)
  }

  const navClass =
    'p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors'
  const selectClass =
    'bg-[#0f0f16] border border-white/10 rounded-lg px-2 py-1 text-white text-xs ' +
    'focus:outline-none focus:border-[#d4af37]/40 cursor-pointer'

  return (
    <FieldPopover
      open={open}
      onOpenChange={setOpen}
      panelClassName="w-[19rem]"
      trigger={
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between gap-2 bg-[#0f0f16] border rounded-xl
            px-3 py-2.5 text-sm text-start transition-colors disabled:opacity-50
            ${open ? 'border-[#d4af37]/40' : 'border-white/10 hover:border-white/20'}`}
        >
          <span className={value ? 'text-white' : 'text-gray-600'}>
            {value ? arDateLong(value) : placeholder}
          </span>
          <CalendarIcon className="w-4 h-4 text-[#d4af37] shrink-0" />
        </button>
      }
    >
      {/* رأس اللوحة — تنقّل بين الشهور واختيار مباشر للشهر والسنة */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <button type="button" className={navClass} aria-label="الشهر السابق"
          onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))}>
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5">
          <select
            value={cursor.getMonth()}
            onChange={e => setCursor(c => new Date(c.getFullYear(), Number(e.target.value), 1))}
            className={selectClass}
          >
            {AR_MONTHS.map((m, i) => (
              <option key={m} value={i} className="bg-[#0f0f16]">{m}</option>
            ))}
          </select>
          <select
            value={cursor.getFullYear()}
            onChange={e => setCursor(c => new Date(Number(e.target.value), c.getMonth(), 1))}
            className={selectClass}
          >
            {years.map(y => (
              <option key={y} value={y} className="bg-[#0f0f16]">{y}</option>
            ))}
          </select>
        </div>

        <button type="button" className={navClass} aria-label="الشهر التالي"
          onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {AR_WEEKDAYS_SHORT.map(d => (
          <span key={d} className="text-center text-[10px] text-gray-500 py-1">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(d => {
          const iso = localISO(d)
          const outside = d.getMonth() !== cursor.getMonth()
          const isSelected = !!selected && iso === value
          const isToday = iso === today

          return (
            <button
              key={iso}
              type="button"
              onClick={() => pick(d)}
              className={`h-8 rounded-lg text-xs transition-colors
                ${isSelected
                  ? 'bg-[#d4af37] text-[#0a0a0f] font-bold'
                  : outside
                    ? 'text-gray-700 hover:bg-white/5 hover:text-gray-400'
                    : 'text-gray-200 hover:bg-white/10'}
                ${isToday && !isSelected ? 'ring-1 ring-[#d4af37]/50' : ''}`}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
        <button
          type="button"
          onClick={() => { onChange(today); setOpen(false) }}
          className="flex-1 py-1.5 rounded-lg text-xs text-[#d4af37] bg-[#d4af37]/10 hover:bg-[#d4af37]/20 transition-colors"
        >
          اليوم
        </button>
        {clearable && (
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-3 h-3" />
            مسح
          </button>
        )}
      </div>
    </FieldPopover>
  )
}
