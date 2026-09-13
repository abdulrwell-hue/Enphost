import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, Save, Trash2, Printer, MessageCircle, CheckCircle, Package as PackageIcon,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Quotation, QuotationStatus } from '../../../lib/types'
import {
  formatSAR, lineAmount, normalizeItems, packageItemOf, serviceTotals, servicesBase,
  type ServiceItem,
} from '../../../lib/catalog'
import QuotationPrint, { type PrintData } from './QuotationPrint'
import DateField from '../../components/admin/DateField'
import ServicesEditor from '../../components/admin/ServicesEditor'
import { inDays, todayISO } from '../../../lib/datetime'

interface Props {
  /** العرض المحفوظ الجاري تعديله — null لعرض جديد */
  quotation: Quotation | null
  /** بيانات مبدئية لعرض جديد (نسخة من عرض سابق) */
  seed?: Quotation | null
  onBack: () => void
  onSaved: () => void
}

const STATUS_OPTIONS: { value: QuotationStatus; label: string }[] = [
  { value: 'draft', label: 'مسودة' },
  { value: 'sent', label: 'أُرسل للعميل' },
  { value: 'accepted', label: 'مقبول' },
  { value: 'rejected', label: 'مرفوض' },
]

const formatDate = (iso: string) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-gray-300 text-sm mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-gray-600 text-xs mt-1">{hint}</span>}
    </label>
  )
}

const inputClass =
  'w-full bg-[#0f0f16] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#d4af37]/40 transition-colors'

export default function QuotationEditor({ quotation, seed = null, onBack, onSaved }: Props) {
  /** مصدر القيم المبدئية: العرض المحفوظ، أو النسخة المكرّرة، أو لا شيء */
  const source = quotation ?? seed
  /** الصف المحفوظ فعلياً — يُملأ بعد أول حفظ حتى لا يتكرر الإدراج */
  const [record, setRecord] = useState<Quotation | null>(quotation)
  const isNew = !record

  // ── Client / project ───────────────────────────────────────────────────────
  const [clientName, setClientName] = useState(source?.client_name ?? '')
  const [clientCompany, setClientCompany] = useState(source?.client_company ?? '')
  const [clientPhone, setClientPhone] = useState(source?.client_phone ?? '')
  const [projectName, setProjectName] = useState(source?.project_name ?? '')
  const [projectLocation, setProjectLocation] = useState(source?.project_location ?? '')
  const [status, setStatus] = useState<QuotationStatus>(source?.status ?? 'draft')
  const [validUntil, setValidUntil] = useState(source?.valid_until ?? inDays(15))
  const [notes, setNotes] = useState(source?.notes ?? '')

  // ── Services ───────────────────────────────────────────────────────────────
  const [items, setItems] = useState<ServiceItem[]>(() => normalizeItems(source?.items))
  const [discountPct, setDiscountPct] = useState(Number(source?.discount_pct ?? 0))
  const [vatEnabled, setVatEnabled] = useState(source?.vat_enabled ?? true)
  const [vatPct, setVatPct] = useState(Number(source?.vat_pct ?? 15))

  const [terms, setTerms] = useState<string[]>(source?.terms ?? [])
  const [business, setBusiness] = useState({ name: '', phone: '', email: '', instagram: '' })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totals = useMemo(
    () => serviceTotals(items, discountPct, vatEnabled, vatPct),
    [items, discountPct, vatEnabled, vatPct],
  )
  const packageItem = packageItemOf(items)

  // Business info + default terms (new quotes only keep a live snapshot)
  useEffect(() => {
    async function load() {
      const [settingsRes, termsRes] = await Promise.all([
        supabase.from('site_settings').select('key, value'),
        supabase.from('terms_conditions').select('text').eq('is_active', true).order('sort_order'),
      ])

      const map: Record<string, string> = {}
      settingsRes.data?.forEach(s => { map[s.key] = s.value })
      setBusiness({
        name: map.business_name || 'Enphost',
        phone: map.whatsapp_number || '',
        email: map.email || '',
        instagram: map.instagram_handle || '',
      })

      // نسخة مكرّرة تحتفظ بشروطها؛ العرض الجديد فقط يأخذ الشروط الحالية
      if (!source && termsRes.data) setTerms(termsRes.data.map(t => t.text))
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scopeSummary = packageItem ? `باقة ${packageItem.name}` : ''

  const printData: PrintData = {
    quoteNumber: record?.quote_number ?? 'مسودة',
    issuedAt: formatDate(record?.created_at?.slice(0, 10) ?? todayISO()),
    validUntil: formatDate(validUntil),
    clientName, clientCompany, clientPhone, projectName, projectLocation,
    scopeSummary, items, totals, vatEnabled, vatPct, discountPct, notes, terms, business,
  }

  async function nextQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { data } = await supabase
      .from('quotations')
      .select('quote_number')
      .like('quote_number', `Q-${year}-%`)
      .order('quote_number', { ascending: false })
      .limit(1)

    const last = data?.[0]?.quote_number
    const lastSeq = last ? Number(last.split('-')[2]) : 0
    const next = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1
    return `Q-${year}-${String(next).padStart(4, '0')}`
  }

  async function save() {
    if (!clientName.trim()) {
      setError('اسم العميل مطلوب')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      status,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim() || null,
      client_company: clientCompany.trim() || null,
      project_name: projectName.trim() || null,
      project_location: projectLocation.trim() || null,
      valid_until: validUntil || null,
      notes: notes.trim() || null,
      package_id: packageItem?.refId ?? null,
      items,
      terms,
      discount_pct: discountPct,
      vat_enabled: vatEnabled,
      vat_pct: vatPct,
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      vat_amount: totals.vatAmount,
      total: totals.total,
    }

    const { data, error } = record
      ? await supabase.from('quotations').update(payload).eq('id', record.id).select().single()
      : await supabase.from('quotations')
          // config كان مدخلات الحاسبة القديمة — يبقى كائناً فارغاً للصفوف الجديدة
          .insert({ ...payload, config: {}, quote_number: await nextQuoteNumber() })
          .select().single()

    setSaving(false)
    if (error) { setError(error.message); return }
    // الحفظ التالي يصبح تحديثاً لهذا الصف، لا إدراجاً جديداً
    if (data) setRecord(data as Quotation)

    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    onSaved()
  }

  function shareWhatsApp() {
    const phone = clientPhone.replace(/\D/g, '')
    const base = servicesBase(items)
    const lines = [
      `*عرض سعر — ${business.name || 'Enphost'}*`,
      record?.quote_number ? `رقم العرض: ${record.quote_number}` : '',
      projectName ? `المشروع: ${projectName}` : '',
      scopeSummary,
      '',
      ...items.map(i => `• ${i.name} — ${formatSAR(lineAmount(i, base))} ريال`),
      '',
      `المجموع: ${formatSAR(totals.subtotal)} ريال`,
      discountPct > 0 ? `خصم ${discountPct}%: -${formatSAR(totals.discountAmount)} ريال` : '',
      vatEnabled ? `الضريبة (${vatPct}%): ${formatSAR(totals.vatAmount)} ريال` : '',
      `*الإجمالي: ${formatSAR(totals.total)} ريال*`,
      validUntil ? `صالح حتى ${formatDate(validUntil)}` : '',
    ].filter(Boolean)

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`
      : `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Header */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
            title="رجوع للقائمة"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isNew ? 'عرض سعر جديد' : `تعديل ${record!.quote_number}`}
            </h1>
            <p className="text-gray-400 mt-0.5 text-sm">
              {scopeSummary || 'اختر الباقة والإضافات — تُضاف الخدمات تلقائياً'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
          >
            <Printer className="w-4 h-4" />
            طباعة / PDF
          </button>
          <button
            onClick={shareWhatsApp}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            واتساب
          </button>
          <button
            onClick={save}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
              saved
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] hover:opacity-90 shadow-lg shadow-[#d4af37]/20'
            }`}
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-[#0a0a0f]/30 border-t-[#0a0a0f] rounded-full animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ' : 'حفظ العرض'}
          </button>
        </div>
      </div>

      {error && (
        <div className="no-print mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="no-print grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left: form ──────────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Client */}
          <section className="bg-[#1a1a24] rounded-2xl border border-white/5 p-6">
            <h2 className="text-white font-bold mb-4">بيانات العميل والمشروع</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="اسم العميل *">
                <input value={clientName} onChange={e => setClientName(e.target.value)}
                  placeholder="محمد العتيبي" className={inputClass} />
              </Field>
              <Field label="الجهة / الشركة">
                <input value={clientCompany} onChange={e => setClientCompany(e.target.value)}
                  placeholder="شركة التطوير العقاري" className={inputClass} />
              </Field>
              <Field label="رقم الجوال" hint="بصيغة دولية للمشاركة عبر واتساب — مثال: 966555555555">
                <input value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                  dir="ltr" placeholder="966555555555" className={inputClass} />
              </Field>
              <Field label="اسم المشروع">
                <input value={projectName} onChange={e => setProjectName(e.target.value)}
                  placeholder="فيلا — حي الياسمين" className={inputClass} />
              </Field>
              <Field label="الموقع">
                <input value={projectLocation} onChange={e => setProjectLocation(e.target.value)}
                  placeholder="الرياض" className={inputClass} />
              </Field>
              <Field label="حالة العرض">
                <select value={status} onChange={e => setStatus(e.target.value as QuotationStatus)}
                  className={inputClass}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value} className="bg-[#0f0f16]">{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="صالح حتى">
                <DateField value={validUntil} onChange={setValidUntil} />
              </Field>
            </div>
          </section>

          {/* Services */}
          <section className="bg-[#1a1a24] rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-1">
              <PackageIcon className="w-5 h-5 text-[#d4af37]" />
              <h2 className="text-white font-bold">الباقة والخدمات</h2>
            </div>
            <p className="text-gray-500 text-xs mb-5">
              الأسعار والمواصفات تُملأ من الباقات والإضافات — عدّل أي بند لهذا العرض فقط
            </p>

            <ServicesEditor items={items} onChange={setItems} />

            {/* Discount / VAT */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
              <Field label="خصم %">
                <input type="number" min={0} max={100} value={discountPct}
                  onChange={e => setDiscountPct(Number(e.target.value))} className={inputClass} />
              </Field>
              <Field label="نسبة الضريبة %">
                <input type="number" min={0} value={vatPct} disabled={!vatEnabled}
                  onChange={e => setVatPct(Number(e.target.value))}
                  className={`${inputClass} disabled:opacity-40`} />
              </Field>
              <label className="flex items-end pb-2.5">
                <span className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={vatEnabled}
                    onChange={e => setVatEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#d4af37]" />
                  <span className="text-gray-300 text-sm">إضافة ضريبة القيمة المضافة</span>
                </span>
              </label>
            </div>
          </section>

          {/* Notes + terms */}
          <section className="bg-[#1a1a24] rounded-2xl border border-white/5 p-6">
            <h2 className="text-white font-bold mb-4">ملاحظات وشروط</h2>
            <Field label="ملاحظات تظهر في العرض">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="مثال: يشمل السعر جولة تعديلات واحدة، والتسليم خلال 5 أيام عمل."
                className={`${inputClass} resize-y`} />
            </Field>

            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">الشروط والأحكام ({terms.length})</span>
                <button
                  onClick={() => setTerms(prev => [...prev, ''])}
                  className="text-[#d4af37] text-xs hover:underline"
                >
                  + إضافة بند
                </button>
              </div>
              <p className="text-gray-600 text-xs mb-3">
                منسوخة من صفحة «الشروط والأحكام» — تعديلها هنا يخص هذا العرض فقط
              </p>
              <div className="space-y-2">
                {terms.map((t, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[#d4af37] text-sm mt-2.5">◄</span>
                    <textarea
                      value={t} rows={1}
                      onChange={e => setTerms(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                      className={`${inputClass} resize-y min-h-[42px] text-xs`}
                    />
                    <button
                      onClick={() => setTerms(prev => prev.filter((_, j) => j !== i))}
                      className="mt-1 w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ── Right: live summary ─────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="xl:sticky xl:top-6 space-y-6">
            <section className="bg-[#1a1a24] rounded-2xl border border-white/5 p-6">
              <h2 className="text-white font-bold mb-4">الإجمالي</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>المجموع الفرعي</span>
                  <span className="text-gray-200">{formatSAR(totals.subtotal)} ريال</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>خصم {discountPct}%</span>
                    <span className="text-red-400">- {formatSAR(totals.discountAmount)} ريال</span>
                  </div>
                )}
                {vatEnabled && (
                  <div className="flex justify-between text-gray-400">
                    <span>ضريبة {vatPct}%</span>
                    <span className="text-gray-200">{formatSAR(totals.vatAmount)} ريال</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 mt-1 border-t border-white/10">
                  <span className="text-white font-bold">الإجمالي</span>
                  <span className="text-[#d4af37] font-black text-lg">
                    {formatSAR(totals.total)} ريال
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Printable version */}
      <QuotationPrint data={printData} />
    </div>
  )
}
