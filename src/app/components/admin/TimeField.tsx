import { useEffect, useRef, useState } from 'react'
import { Clock, X } from 'lucide-react'
import FieldPopover from './FieldPopover'
import { arTime, parseTime, toHHmm } from '../../../lib/datetime'

interface Props {
  /** الوقت بصيغة HH:mm (٢٤ ساعة) — أو '' إن لم يُحدَّد */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** خطوة الدقائق في القائمة */
  minuteStep?: number
  disabled?: boolean
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1) // 12, 1..11 يُعاد ترتيبها أدناه
const ORDERED_HOURS = [12, ...HOURS_12.slice(0, 11)]         // 12, 1, 2, … 11

const DEFAULT = { h: 9, m: 0 } // ٩ صباحاً — بداية يوم تصوير معتادة

export default function TimeField({
  value, onChange, placeholder = 'اختر الساعة', minuteStep = 5, disabled = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const parsed = parseTime(value) ?? DEFAULT

  const hour12 = parsed.h % 12 === 0 ? 12 : parsed.h % 12
  const isPM = parsed.h >= 12
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep)

  const hourColRef = useRef<HTMLDivElement>(null)
  const minuteColRef = useRef<HTMLDivElement>(null)

  // أظهر الخيار المحدد داخل العمود عند الفتح
  useEffect(() => {
    if (!open) return
    for (const col of [hourColRef.current, minuteColRef.current]) {
      col?.querySelector('[data-selected="true"]')
        ?.scrollIntoView({ block: 'center' })
    }
  }, [open])

  /** يبني القيمة الجديدة من الأجزاء الثلاثة ويحافظ على ما لم يتغيّر */
  function emit(next: { hour12?: number; minute?: number; pm?: boolean }) {
    const h12 = next.hour12 ?? hour12
    const m = next.minute ?? parsed.m
    const pm = next.pm ?? isPM
    const h24 = (h12 % 12) + (pm ? 12 : 0)
    onChange(toHHmm(h24, m))
  }

  const colClass =
    'flex-1 max-h-44 overflow-y-auto thin-scroll rounded-xl bg-[#0f0f16] border border-white/5 p-1 space-y-0.5'
  const optionClass = (active: boolean) =>
    `w-full py-1.5 rounded-lg text-xs transition-colors ${active
      ? 'bg-[#d4af37] text-[#0a0a0f] font-bold'
      : 'text-gray-300 hover:bg-white/10'}`

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
            {value ? arTime(value) : placeholder}
          </span>
          <Clock className="w-4 h-4 text-[#d4af37] shrink-0" />
        </button>
      }
    >
      <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-500">
        <span className="flex-1 text-center">الساعة</span>
        <span className="flex-1 text-center">الدقيقة</span>
        <span className="w-16 text-center">الفترة</span>
      </div>

      <div className="flex items-start gap-2">
        <div ref={hourColRef} className={colClass}>
          {ORDERED_HOURS.map(h => (
            <button
              key={h} type="button" data-selected={h === hour12}
              onClick={() => emit({ hour12: h })}
              className={optionClass(h === hour12)}
            >
              {h}
            </button>
          ))}
        </div>

        <div ref={minuteColRef} className={colClass}>
          {minutes.map(m => (
            <button
              key={m} type="button" data-selected={m === parsed.m}
              onClick={() => emit({ minute: m })}
              className={optionClass(m === parsed.m)}
            >
              {String(m).padStart(2, '0')}
            </button>
          ))}
        </div>

        <div className="w-16 space-y-1">
          {[{ label: 'صباحاً', pm: false }, { label: 'مساءً', pm: true }].map(p => (
            <button
              key={p.label} type="button"
              onClick={() => emit({ pm: p.pm })}
              className={`${optionClass(isPM === p.pm)} px-1`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
        <span className="flex-1 text-center text-xs text-gray-400">
          {value ? arTime(value) : '—'}
        </span>
        <button
          type="button"
          onClick={() => { onChange(''); setOpen(false) }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-3 h-3" />
          مسح
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 rounded-lg text-xs text-[#d4af37] bg-[#d4af37]/10 hover:bg-[#d4af37]/20 transition-colors"
        >
          تم
        </button>
      </div>
    </FieldPopover>
  )
}
