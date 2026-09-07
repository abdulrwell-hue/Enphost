import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, Save, Plus, Trash2, Printer, MessageCircle, Wand2,
  AlertTriangle, CheckCircle, SlidersHorizontal, Calculator,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Quotation, QuotationStatus } from '../../../lib/types'
import {
  DEFAULT_INPUT, TIERS, estimate, formatSAR, newLineItem, totalsFor,
  type LineItem, type PricingConfig, type QuoteInput,
} from '../../../lib/pricing'
import QuotationPrint, { type PrintData } from './QuotationPrint'
import QuotationPricingSettings from './QuotationPricingSettings'

interface Props {
  /** العرض المحفوظ الجاري تعديله — null لعرض جديد */
  quotation: Quotation | null
  /** بيانات مبدئية لعرض جديد (نسخة من عرض سابق) */
  seed?: Quotation | null
  config: PricingConfig
  onConfigChange: (config: PricingConfig) => void
  onBack: () => void
  onSaved: () => void
}

const STATUS_OPTIONS: { value: QuotationStatus; label: string }[] = [
  { value: 'draft', label: 'مسودة' },
  { value: 'sent', label: 'أُرسل للعميل' },
  { value: 'accepted', label: 'مقبول' },
  { value: 'rejected', label: 'مرفوض' },
]

const todayISO = () => new Date().toISOString().slice(0, 10)
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
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

export default function QuotationEditor({
  quotation, seed = null, config, onConfigChange, onBack, onSaved,
}: Props) {
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

  // ── Calculator ─────────────────────────────────────────────────────────────
  const [input, setInput] = useState<QuoteInput>({ ...DEFAULT_INPUT, ...(source?.config ?? {}) })
  const [items, setItems] = useState<LineItem[]>(source?.items ?? [])
  /** يتوقف التوليد التلقائي بمجرد تعديل البنود يدوياً */
  const [autoItems, setAutoItems] = useState(!source)

  const [discountPct, setDiscountPct] = useState(Number(source?.discount_pct ?? 0))
  const [vatEnabled, setVatEnabled] = useState(source?.vat_enabled ?? true)
  const [vatPct, setVatPct] = useState(Number(source?.vat_pct ?? config.vatPct))

  const [terms, setTerms] = useState<string[]>(source?.terms ?? [])
  const [business, setBusiness] = useState({ name: '', phone: '', email: '', instagram: '' })

  const [showPricingSettings, setShowPricingSettings] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const est = useMemo(() => estimate(input, config), [input, config])
  const totals = useMemo(
    () => totalsFor(items, discountPct, vatEnabled, vatPct),
    [items, discountPct, vatEnabled, vatPct],
  )

  // Seed items from the calculator until the admin edits them by hand
  useEffect(() => {
    if (autoItems) setItems(est.items)
  }, [est, autoItems])

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

  function patchInput(patch: Partial<QuoteInput>) {
    setInput(prev => ({ ...prev, ...patch }))
  }

  function editItem(id: string, patch: Partial<LineItem>) {
    setAutoItems(false)
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  function removeItem(id: string) {
    setAutoItems(false)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function addItem() {
    setAutoItems(false)
    setItems(prev => [...prev, newLineItem()])
  }

  function toggleAddOn(key: string) {
    patchInput({
      addOns: input.addOns.includes(key)
        ? input.addOns.filter(k => k !== key)
        : [...input.addOns, key],
    })
  }

  const scopeSummary = useMemo(() => {
    const tier = TIERS.find(t => t.key === input.tier)
    const parts = [
      `${input.units} ${input.units === 1 ? 'وحدة' : 'وحدة'}`,
      input.units > 1 ? (input.similar ? 'وحدات متشابهة' : 'وحدات مختلفة') : '',
      tier?.label,
      `${input.photosPerUnit} صورة للوحدة`,
    ]
    return parts.filter(Boolean).join(' — ')
  }, [input])

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
      config: input,
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
          .insert({ ...payload, quote_number: await nextQuoteNumber() })
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
    const lines = [
      `*عرض سعر — ${business.name || 'Enphost'}*`,
      record?.quote_number ? `رقم العرض: ${record.quote_number}` : '',
      projectName ? `المشروع: ${projectName}` : '',
      scopeSummary,
      '',
      ...items.map(i => `• ${i.label} — ${formatSAR(i.qty * i.unitPrice)} ريال`),
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
            <p className="text-gray-400 mt-0.5 text-sm">{scopeSummary}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPricingSettings(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            إعدادات التسعير
          </button>
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
                  placeholder="مشروع 15 شقة — حي الياسمين" className={inputClass} />
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
                <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                  className={inputClass} />
              </Field>
            </div>
          </section>

          {/* Calculator */}
          <section className="bg-[#1a1a24] rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="w-5 h-5 text-[#d4af37]" />
              <h2 className="text-white font-bold">حاسبة التسعير</h2>
            </div>
            <p className="text-gray-500 text-xs mb-5">
              المشروع لا يُسعّر بضرب سعر الوحدة في العدد — الانتقال والتجهيز يتكرر مرة واحدة،
              والوحدات المتشابهة يكفيها تصوير نماذج
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Field label="عدد الوحدات">
                <input type="number" min={1} value={input.units}
                  onChange={e => patchInput({ units: Math.max(1, Number(e.target.value)) })}
                  className={inputClass} />
              </Field>
              <Field label="عدد الصور لكل وحدة">
                <input type="number" min={1} value={input.photosPerUnit}
                  onChange={e => patchInput({ photosPerUnit: Math.max(1, Number(e.target.value)) })}
                  className={inputClass} />
              </Field>
            </div>

            {/* Tier */}
            <p className="text-gray-300 text-sm mb-2">مستوى التسليم</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {TIERS.map(t => (
                <button
                  key={t.key}
                  onClick={() => patchInput({ tier: t.key, photosPerUnit: t.defaultPhotos })}
                  className={`text-right p-4 rounded-xl border transition-all ${
                    input.tier === t.key
                      ? 'bg-[#d4af37]/10 border-[#d4af37]/40'
                      : 'bg-[#0f0f16] border-white/10 hover:border-white/20'
                  }`}
                >
                  <p className={`font-bold text-sm ${input.tier === t.key ? 'text-[#d4af37]' : 'text-white'}`}>
                    {t.label}
                  </p>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{t.deliverable}</p>
                  <p className="text-gray-600 text-xs mt-2">
                    {formatSAR(config.tierRates[t.key])} ريال / وحدة (أساسي)
                  </p>
                </button>
              ))}
            </div>

            {/* Similarity */}
            {input.units > 1 && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { similar: true, label: 'الوحدات متشابهة', hint: 'تصوير نماذج + المرافق والواجهات' },
                  { similar: false, label: 'الوحدات مختلفة', hint: 'تصوير كل وحدة على حدة' },
                ].map(opt => (
                  <button
                    key={String(opt.similar)}
                    onClick={() => patchInput({ similar: opt.similar })}
                    className={`text-right p-4 rounded-xl border transition-all ${
                      input.similar === opt.similar
                        ? 'bg-[#d4af37]/10 border-[#d4af37]/40'
                        : 'bg-[#0f0f16] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <p className={`font-bold text-sm ${input.similar === opt.similar ? 'text-[#d4af37]' : 'text-white'}`}>
                      {opt.label}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">{opt.hint}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Add-ons */}
            <p className="text-gray-300 text-sm mb-2">إضافات</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {config.addOns.map(a => {
                const on = input.addOns.includes(a.key)
                return (
                  <button
                    key={a.key}
                    onClick={() => toggleAddOn(a.key)}
                    className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                      on
                        ? 'bg-[#d4af37]/10 border-[#d4af37]/40 text-[#d4af37]'
                        : 'bg-[#0f0f16] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {a.label}
                    <span className="text-xs opacity-60 mr-2">
                      {a.type === 'percent' ? `+${a.amount}%` : `+${formatSAR(a.amount)}`}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Days */}
            <Field
              label="أيام التصوير"
              hint={`محسوبة تلقائياً: ${Math.max(1, Math.ceil(est.billableUnits / (config.unitsPerDay[input.tier] || 8)))} يوم — اتركه فارغاً للحساب التلقائي`}
            >
              <input
                type="number" min={1}
                value={input.daysOverride ?? ''}
                placeholder={String(est.days)}
                onChange={e => patchInput({
                  daysOverride: e.target.value === '' ? null : Math.max(1, Number(e.target.value)),
                })}
                className={inputClass}
              />
            </Field>
          </section>

          {/* Line items */}
          <section className="bg-[#1a1a24] rounded-2xl border border-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-white font-bold">بنود العرض</h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  {autoItems
                    ? 'تُولَّد تلقائياً من الحاسبة — أي تعديل يدوي يوقف التوليد'
                    : 'بنود معدّلة يدوياً'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!autoItems && (
                  <button
                    onClick={() => setAutoItems(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-[#d4af37] bg-[#d4af37]/10 hover:bg-[#d4af37]/20 transition-all"
                  >
                    <Wand2 className="w-4 h-4" />
                    إعادة التوليد من الحاسبة
                  </button>
                )}
                <button
                  onClick={addItem}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  بند
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-10">لا توجد بنود بعد</p>
            ) : (
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="bg-[#0f0f16] rounded-xl border border-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <input
                          value={item.label}
                          onChange={e => editItem(item.id, { label: e.target.value })}
                          placeholder="اسم البند"
                          className="w-full bg-transparent text-white font-bold text-sm focus:outline-none placeholder-gray-600"
                        />
                        <input
                          value={item.description}
                          onChange={e => editItem(item.id, { description: e.target.value })}
                          placeholder="وصف مختصر يظهر للعميل"
                          className="w-full bg-transparent text-gray-500 text-xs focus:outline-none placeholder-gray-700"
                        />
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                        title="حذف البند"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                      <label className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">الكمية</span>
                        <input
                          type="number" min={0} value={item.qty}
                          onChange={e => editItem(item.id, { qty: Number(e.target.value) })}
                          className="w-20 bg-[#1a1a24] border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40"
                        />
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">سعر الوحدة</span>
                        <input
                          type="number" min={0} value={item.unitPrice}
                          onChange={e => editItem(item.id, { unitPrice: Number(e.target.value) })}
                          className="w-28 bg-[#1a1a24] border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40"
                        />
                      </label>
                      <span className="mr-auto text-[#d4af37] font-bold text-sm">
                        {formatSAR(item.qty * item.unitPrice)} ريال
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

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

            {/* Suggested range */}
            <section className="bg-gradient-to-br from-[#d4af37]/12 to-transparent rounded-2xl border border-[#d4af37]/20 p-6">
              <p className="text-[#d4af37] text-sm font-bold mb-1">السعر المقترح للمشروع</p>
              <p className="text-white text-2xl font-black leading-tight">
                {formatSAR(est.rangeLow)} – {formatSAR(est.rangeHigh)}
                <span className="text-sm font-normal text-gray-400 mr-2">ريال</span>
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>وحدات تُصوَّر فعلياً</span>
                  <span className="text-gray-200">{est.billableUnits} من {input.units}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>سعر الوحدة بعد معامل الحجم</span>
                  <span className="text-gray-200">{formatSAR(est.unitPrice)} ريال (×{est.volumeFactor})</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>أيام التصوير</span>
                  <span className="text-gray-200">{est.days}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>التكلفة الفعلية لكل وحدة</span>
                  <span className="text-gray-200">{formatSAR(est.effectiveUnitRate)} ريال</span>
                </div>
              </div>

              {est.underCommercialRate && (
                <div className="mt-4 flex gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-300/90 text-xs leading-relaxed">
                    السعر الفعلي للوحدة أقل من {formatSAR(config.minCommercialUnitRate)} ريال.
                    لا يُنصح بالنزول لهذا المستوى إلا لتوثيق سريع بأربع صور دون معالجة متقدمة،
                    وبحد أدنى تعاقدي كبير.
                  </p>
                </div>
              )}
            </section>

            {/* Totals */}
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

              {Math.abs(totals.subtotal - est.base) > 1 && (
                <p className="text-gray-600 text-xs mt-4 leading-relaxed">
                  المجموع الحالي يختلف عن السعر الأساسي المقترح ({formatSAR(est.base)} ريال)
                  لأن البنود عُدّلت يدوياً.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Printable version */}
      <QuotationPrint data={printData} />

      {showPricingSettings && (
        <QuotationPricingSettings
          config={config}
          onClose={() => setShowPricingSettings(false)}
          onSaved={next => { onConfigChange(next); setVatPct(next.vatPct) }}
        />
      )}
    </div>
  )
}
