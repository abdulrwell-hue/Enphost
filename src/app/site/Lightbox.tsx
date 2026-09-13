import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { PortfolioItem } from '../../lib/types'

interface Props {
  items: PortfolioItem[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
}

/** Full-screen photo viewer. RTL: ← goes to the next photo, → to the previous. */
export default function Lightbox({ items, index, onIndex, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const item = items[index]
  const next = () => onIndex((index + 1) % items.length)
  const prev = () => onIndex((index - 1 + items.length) % items.length)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') next()
      if (e.key === 'ArrowRight') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const nav = 'grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="عارض الصور"
      dir="rtl"
      className="fixed inset-0 z-[70] flex flex-col bg-black/95 font-body"
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-4 text-sm text-gray-300" onClick={e => e.stopPropagation()}>
        <span dir="ltr">{index + 1} / {items.length}</span>
        <button ref={closeRef} type="button" onClick={onClose} className={nav} aria-label="إغلاق">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 md:px-20">
        <img
          key={item.id}
          src={item.public_url}
          alt={item.title || 'تصوير عقاري احترافي'}
          className="max-h-full max-w-full rounded-lg object-contain"
          onClick={e => e.stopPropagation()}
        />
        {items.length > 1 && (
          <>
            <button type="button" onClick={e => { e.stopPropagation(); prev() }} className={`${nav} absolute right-3 md:right-6`} aria-label="الصورة السابقة">
              <ChevronRight className="h-6 w-6" />
            </button>
            <button type="button" onClick={e => { e.stopPropagation(); next() }} className={`${nav} absolute left-3 md:left-6`} aria-label="الصورة التالية">
              <ChevronLeft className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {item.title && (
        <p className="px-4 pb-6 text-center text-base font-semibold text-gray-200" onClick={e => e.stopPropagation()}>{item.title}</p>
      )}
    </div>,
    document.body,
  )
}
