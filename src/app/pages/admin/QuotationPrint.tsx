import { formatSAR, type LineItem, type Totals } from '../../../lib/pricing'

export interface PrintData {
  quoteNumber: string
  issuedAt: string
  validUntil: string
  clientName: string
  clientCompany: string
  clientPhone: string
  projectName: string
  projectLocation: string
  scopeSummary: string
  items: LineItem[]
  totals: Totals
  vatEnabled: boolean
  vatPct: number
  discountPct: number
  notes: string
  terms: string[]
  business: { name: string; phone: string; email: string; instagram: string }
}

/**
 * Paper version of the quotation. Hidden on screen (`.print-sheet`) and revealed
 * by the print rules in styles/index.css, so «طباعة / PDF» prints only this.
 */
export default function QuotationPrint({ data }: { data: PrintData }) {
  const {
    quoteNumber, issuedAt, validUntil, clientName, clientCompany, clientPhone,
    projectName, projectLocation, scopeSummary, items, totals, vatEnabled,
    vatPct, discountPct, notes, terms, business,
  } = data

  return (
    <div
      id="print-sheet"
      className="print-sheet bg-white text-[#111]"
      dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-[#d4af37] pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">عرض سعر</h1>
          <p className="text-sm text-[#555] mt-1">رقم العرض: {quoteNumber}</p>
          <p className="text-sm text-[#555]">تاريخ الإصدار: {issuedAt}</p>
          {validUntil && <p className="text-sm text-[#555]">صالح حتى: {validUntil}</p>}
        </div>
        <div className="text-left">
          <p className="text-xl font-black text-[#b8952e]">{business.name || 'Enphost'}</p>
          <p className="text-xs text-[#555] mt-1">تصوير عقاري احترافي</p>
          {business.phone && <p className="text-xs text-[#555] mt-1" dir="ltr">{business.phone}</p>}
          {business.email && <p className="text-xs text-[#555]" dir="ltr">{business.email}</p>}
          {business.instagram && <p className="text-xs text-[#555]" dir="ltr">@{business.instagram}</p>}
        </div>
      </div>

      {/* Client + project */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs font-bold text-[#b8952e] mb-2">مقدَّم إلى</p>
          <p className="font-bold">{clientName || '—'}</p>
          {clientCompany && <p className="text-sm text-[#555]">{clientCompany}</p>}
          {clientPhone && <p className="text-sm text-[#555]" dir="ltr">{clientPhone}</p>}
        </div>
        <div>
          <p className="text-xs font-bold text-[#b8952e] mb-2">المشروع</p>
          <p className="font-bold">{projectName || '—'}</p>
          {projectLocation && <p className="text-sm text-[#555]">{projectLocation}</p>}
          {scopeSummary && <p className="text-sm text-[#555] mt-1">{scopeSummary}</p>}
        </div>
      </div>

      {/* Items */}
      <table className="w-full text-sm border-collapse mb-6">
        <thead>
          <tr className="bg-[#f6f2e6] text-[#7a6420]">
            <th className="text-right font-bold py-2.5 px-3 border border-[#e6ddc4]">البند</th>
            <th className="text-center font-bold py-2.5 px-3 border border-[#e6ddc4] w-20">الكمية</th>
            <th className="text-center font-bold py-2.5 px-3 border border-[#e6ddc4] w-28">سعر الوحدة</th>
            <th className="text-center font-bold py-2.5 px-3 border border-[#e6ddc4] w-28">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} style={{ breakInside: 'avoid' }}>
              <td className="py-2.5 px-3 border border-[#e6ddc4] align-top">
                <p className="font-bold">{item.label || '—'}</p>
                {item.description && (
                  <p className="text-xs text-[#666] mt-0.5 leading-relaxed">{item.description}</p>
                )}
              </td>
              <td className="py-2.5 px-3 border border-[#e6ddc4] text-center align-top">{item.qty}</td>
              <td className="py-2.5 px-3 border border-[#e6ddc4] text-center align-top">
                {formatSAR(item.unitPrice)}
              </td>
              <td className="py-2.5 px-3 border border-[#e6ddc4] text-center align-top font-bold">
                {formatSAR(item.qty * item.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-start mb-6" style={{ breakInside: 'avoid' }}>
        <div className="w-72 text-sm">
          <div className="flex justify-between py-1.5 border-b border-[#eee]">
            <span className="text-[#555]">المجموع الفرعي</span>
            <span className="font-bold">{formatSAR(totals.subtotal)} ريال</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between py-1.5 border-b border-[#eee]">
              <span className="text-[#555]">خصم ({discountPct}%)</span>
              <span className="font-bold text-[#b00]">- {formatSAR(totals.discountAmount)} ريال</span>
            </div>
          )}
          {vatEnabled && (
            <div className="flex justify-between py-1.5 border-b border-[#eee]">
              <span className="text-[#555]">ضريبة القيمة المضافة ({vatPct}%)</span>
              <span className="font-bold">{formatSAR(totals.vatAmount)} ريال</span>
            </div>
          )}
          <div className="flex justify-between py-3 mt-1 bg-[#f6f2e6] px-3 rounded">
            <span className="font-black">الإجمالي</span>
            <span className="font-black text-[#b8952e]">{formatSAR(totals.total)} ريال</span>
          </div>
          {!vatEnabled && (
            <p className="text-[10px] text-[#888] mt-2">
              الأسعار لا تشمل ضريبة القيمة المضافة إن وُجدت.
            </p>
          )}
        </div>
      </div>

      {notes && (
        <div className="mb-6" style={{ breakInside: 'avoid' }}>
          <p className="text-xs font-bold text-[#b8952e] mb-2">ملاحظات</p>
          <p className="text-sm text-[#333] leading-relaxed whitespace-pre-line">{notes}</p>
        </div>
      )}

      {terms.length > 0 && (
        <div style={{ breakInside: 'avoid' }}>
          <p className="text-xs font-bold text-[#b8952e] mb-2">الشروط والأحكام</p>
          <ul className="text-xs text-[#444] space-y-1.5 leading-relaxed">
            {terms.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[#d4af37]">◄</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-[#eee] text-center text-[10px] text-[#999]">
        شكراً لثقتكم — {business.name || 'Enphost'}
      </div>
    </div>
  )
}
