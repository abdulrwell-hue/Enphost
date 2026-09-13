import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const GAP = 8      // المسافة بين الحقل واللوحة
const EDGE = 8     // هامش أدنى عن حافة النافذة
const MIN_H = 180  // لا نضغط اللوحة تحت هذا الارتفاع

/**
 * الحاوية المشتركة لمنتقي التاريخ والوقت: زر يفتح لوحة منسدلة،
 * تُغلق بالنقر خارجها أو بمفتاح Escape، وتفتح في الجهة الأوسع
 * (أعلى أو أسفل الحقل) مع تقييد ارتفاعها حتى لا تخرج عن الشاشة.
 */
export default function FieldPopover({
  open, onOpenChange, trigger, children, panelClassName = '',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: React.ReactNode
  children: React.ReactNode
  panelClassName?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState<{ up: boolean; maxHeight: number | undefined }>(
    { up: false, maxHeight: undefined },
  )

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) onOpenChange(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); onOpenChange(false) }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange])

  useLayoutEffect(() => {
    if (!open) { setPlacement({ up: false, maxHeight: undefined }); return }

    function position() {
      const anchor = wrapRef.current?.getBoundingClientRect()
      const panel = panelRef.current
      if (!anchor || !panel) return

      const below = window.innerHeight - anchor.bottom - GAP - EDGE
      const above = anchor.top - GAP - EDGE
      // ابقَ أسفل الحقل ما دامت اللوحة تتسع؛ وإلا اختر الجهة الأوسع
      const up = panel.scrollHeight > below && above > below
      const room = Math.max(MIN_H, up ? above : below)

      setPlacement({ up, maxHeight: panel.scrollHeight > room ? room : undefined })
    }

    position()
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    return () => {
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      {trigger}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          style={{ maxHeight: placement.maxHeight }}
          className={`absolute z-50 ${placement.up ? 'bottom-full mb-2' : 'top-full mt-2'} start-0
            overflow-y-auto thin-scroll overscroll-contain
            bg-[#14141c] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 p-3 ${panelClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
