import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, Save, Plus, Trash2, Printer, MessageCircle,
  CheckCircle, Scale, Building2, User, FileSignature,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Contract, ContractClause, Quotation } from '../../../lib/types'
import { formatSAR } from '../../../lib/pricing'
import {
  PORTFOLIO_USAGE_OPTIONS, contractTotals, itemsFromQuotation, newContractItem,
  type ContractClauseSnapshot, type ContractItem, type ContractStatus, type PortfolioUsage,
} from '../../../lib/contracts'
import ContractPrint, { type ContractPrintData } from './ContractPrint'

interface Props {
  /** العقد المحفوظ الجاري تعديله — null لعقد جديد */
  contract: Contract | null
  /** عرض سعر يُحوَّل إلى عقد جديد */
  fromQuotation?: Quotation | null
  onBack: () => void
  onSaved: () => void
}

const STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: 'draft',     label: 'مسودة' },
  { value: 'sent',      label: 'أُرسل للعميل' },
  { value: 'signed',    label: 'موقّع' },
  { value: 'cancelled', label: 'ملغي' },
]

/**
 * YYYY-MM-DD في التوقيت المحلي. toISOString() يعطي توقيت UTC، فيرجع تاريخ الأمس
 * لأي عقد يُنشأ بعد منتصف الليل بتوقيت الرياض (UTC+3).
 */
const localISO = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

const todayISO = () => localISO(new Date())
const inDays = (n: number) => localISO(new Date(Date.now() + n * 86400000))

/** 2026-09-06 → 06 / 09 / 2026م */
const arDate = (iso: string) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d} / ${m} / ${y}م`
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-gray-300 text-sm mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-gray-600 text-xs mt-1">{hint}</span>}
    </label>
  )
}

function Section({
  icon: Icon, title, subtitle, children,
}: {
  icon: React.ElementType; title: string; subtitle?: string; children: React.ReactNode
}) {
  return (
    <section className="bg-[#1a1a24] rounded-2xl border border-white/5 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5 text-[#d4af37]" />
        <h2 className="text-white font-bold">{title}</h2>
      </div>
      {subtitle && <p className="text-gray-500 text-xs mb-5">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </section>
  )
}

const inputClass =
  'w-full bg-[#0f0f16] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#d4af37]/40 transition-colors'

export default function ContractEditor({ contract, fromQuotation = null, onBack, onSaved }: Props) {
  /** الصف المحفوظ فعلياً — يُملأ بعد أول حفظ حتى لا يتكرر الإدراج */
  const [record, setRecord] = useState<Contract | null>(contract)
  const isNew = !record
  const c = contract

  // ── بيانات العقد ───────────────────────────────────────────────────────────
  const [status, setStatus]     = useState<ContractStatus>(c?.status ?? 'draft')
  const [signDate, setSignDate] = useState(c?.sign_date ?? todayISO())
  const [signCity, setSignCity] = useState(c?.sign_city ?? 'الرياض')
  const [durationFrom, setDurationFrom] = useState(c?.duration_from ?? todayISO())
  const [durationTo, setDurationTo]     = useState(c?.duration_to ?? inDays(365))
  const [orderNumber, setOrderNumber]   = useState(c?.order_number ?? '')

  // ── الطرف الأول ────────────────────────────────────────────────────────────
  const [provLegalName, setProvLegalName]   = useState(c?.provider_legal_name ?? '')
  const [provRegistration, setProvRegistration] = useState(c?.provider_registration ?? '')
  const [provAddress, setProvAddress]       = useState(c?.provider_address ?? 'مدينة الرياض')
  const [provRepName, setProvRepName]       = useState(c?.provider_rep_name ?? '')
  const [provRepTitle, setProvRepTitle]     = useState(c?.provider_rep_title ?? 'مالك المنشأة')
  const [provPhone, setProvPhone]           = useState(c?.provider_phone ?? '')
  const [provEmail, setProvEmail]           = useState(c?.provider_email ?? '')

  // ── الطرف الثاني ───────────────────────────────────────────────────────────
  const [clientName, setClientName]     = useState(c?.client_name ?? fromQuotation?.client_company ?? fromQuotation?.client_name ?? '')
  const [clientIdNumber, setClientIdNumber] = useState(c?.client_id_number ?? '')
  const [clientAddress, setClientAddress]   = useState(c?.client_address ?? '')
  const [clientRepName, setClientRepName]   = useState(c?.client_rep_name ?? fromQuotation?.client_name ?? '')
  const [clientRepTitle, setClientRepTitle] = useState(c?.client_rep_title ?? '')
  const [clientPhone, setClientPhone]       = useState(c?.client_phone ?? fromQuotation?.client_phone ?? '')
  const [clientEmail, setClientEmail]       = useState(c?.client_email ?? '')

  // ── بيانات المشروع ─────────────────────────────────────────────────────────
  const [propertyName, setPropertyName]         = useState(c?.property_name ?? fromQuotation?.project_name ?? '')
  const [propertyLocation, setPropertyLocation] = useState(c?.property_location ?? fromQuotation?.project_location ?? '')
  const [shootDate, setShootDate]               = useState(c?.shoot_date ?? '')
  const [shootTime, setShootTime]               = useState(c?.shoot_time ?? '')
  const [siteContactName, setSiteContactName]   = useState(c?.site_contact_name ?? '')
  const [siteContactPhone, setSiteContactPhone] = useState(c?.site_contact_phone ?? '')

  // ── الخدمات والمالية ───────────────────────────────────────────────────────
  const [items, setItems] = useState<ContractItem[]>(
    c?.items ?? (fromQuotation ? itemsFromQuotation(fromQuotation.items) : []),
  )
  const [discountPct, setDiscountPct] = useState(Number(c?.discount_pct ?? fromQuotation?.discount_pct ?? 0))
  const [vatEnabled, setVatEnabled]   = useState(c?.vat_enabled ?? fromQuotation?.vat_enabled ?? true)
  const [vatPct, setVatPct]           = useState(Number(c?.vat_pct ?? fromQuotation?.vat_pct ?? 15))
  const [depositPct, setDepositPct]   = useState(Number(c?.deposit_pct ?? 50))
  const [balanceDueOn, setBalanceDueOn] = useState(c?.balance_due_on ?? 'تسليم النسخ النهائية')

  // ── شروط التنفيذ ───────────────────────────────────────────────────────────
  const [revisionRounds, setRevisionRounds]   = useState(Number(c?.revision_rounds ?? 1))
  const [deliveryFormat, setDeliveryFormat]   = useState(c?.delivery_format ?? 'JPG / MP4 / رابط')
  const [platforms, setPlatforms]             = useState(c?.platforms ?? 'Instagram / TikTok / موقع العميل')
  const [rawFilesIncluded, setRawFilesIncluded] = useState(c?.raw_files_included ?? false)
  const [rawFilesPrice, setRawFilesPrice]     = useState(Number(c?.raw_files_price ?? 0))
  const [travelFeeIncluded, setTravelFeeIncluded] = useState(c?.travel_fee_included ?? true)
  const [travelFee, setTravelFee]             = useState(Number(c?.travel_fee ?? 0))
  const [rescheduleTerms, setRescheduleTerms] = useState(c?.reschedule_terms ?? '')
  const [portfolioUsage, setPortfolioUsage]   = useState<PortfolioUsage>(c?.portfolio_usage ?? 'on_approval')
  const [notes, setNotes] = useState(c?.notes ?? fromQuotation?.notes ?? '')

  // ── البنود ─────────────────────────────────────────────────────────────────
  const [clauses, setClauses] = useState<ContractClauseSnapshot[]>(c?.clauses ?? [])
  const [businessName, setBusinessName] = useState('')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const totals = useMemo(
    () => contractTotals(items, discountPct, vatEnabled, vatPct, depositPct),
    [items, discountPct, vatEnabled, vatPct, depositPct],
  )

  // بيانات المنشأة والبنود الحالية — العقد الجديد فقط يأخذ لقطة حديثة
  useEffect(() => {
    async function load() {
      const [settingsRes, clausesRes] = await Promise.all([
        supabase.from('site_settings').select('key, value'),
        supabase.from('contract_clauses').select('slug, title, body')
          .eq('is_active', true).order('sort_order'),
      ])

      const map: Record<string, string> = {}
      settingsRes.data?.forEach(s => { map[s.key] = s.value })
      setBusinessName(map.business_name || 'Enpho Studio')

      if (!contract) {
        setProvLegalName(prev => prev || map.business_name || 'Enpho Studio')
        setProvPhone(prev => prev || map.whatsapp_number || '')
        setProvEmail(prev => prev || map.email || '')
        if (clausesRes.data) {
          setClauses((clausesRes.data as Pick<ContractClause, 'slug' | 'title' | 'body'>[])
            .map(x => ({ slug: x.slug, title: x.title, body: x.body })))
        }
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function editItem(id: string, patch: Partial<ContractItem>) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  const printData: ContractPrintData = {
    contractNumber: record?.contract_number ?? 'مسودة',
    orderNumber,
    signDate: arDate(signDate),
    signCity,
    durationFrom: arDate(durationFrom),
    durationTo: arDate(durationTo),
    provider: {
      legalName: provLegalName, registration: provRegistration, address: provAddress,
      repName: provRepName, repTitle: provRepTitle, phone: provPhone, email: provEmail,
    },
    client: {
      name: clientName, idNumber: clientIdNumber, address: clientAddress,
      repName: clientRepName, repTitle: clientRepTitle, phone: clientPhone, email: clientEmail,
    },
    propertyName, propertyLocation,
    shootDate: arDate(shootDate), shootTime,
    siteContactName, siteContactPhone,
    items, totals, discountPct, vatEnabled, vatPct, depositPct, balanceDueOn,
    revisionRounds, deliveryFormat, platforms,
    rawFilesIncluded, rawFilesPrice, travelFeeIncluded, travelFee, rescheduleTerms,
    portfolioUsage, notes, clauses, businessName,
  }

  async function nextNumbers(): Promise<{ contract: string; order: string }> {
    const year = new Date().getFullYear()
    const { data } = await supabase
      .from('contracts')
      .select('contract_number')
      .like('contract_number', `ENP-${year}-%`)
      .order('contract_number', { ascending: false })
      .limit(1)

    const lastSeq = Number(data?.[0]?.contract_number?.split('-')[2])
    const next = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1
    const padded = String(next).padStart(4, '0')
    return { contract: `ENP-${year}-${padded}`, order: `ENP-WO-${year}-${padded}` }
  }

  async function save() {
    if (!clientName.trim()) { setError('اسم العميل (الطرف الثاني) مطلوب'); return }
    setSaving(true)
    setError(null)

    const numbers = record ? null : await nextNumbers()
    const payload = {
      status,
      order_number: (orderNumber || numbers?.order) ?? null,
      sign_date: signDate || null,
      sign_city: signCity.trim() || 'الرياض',
      duration_from: durationFrom || null,
      duration_to: durationTo || null,

      provider_legal_name: provLegalName.trim(),
      provider_registration: provRegistration.trim() || null,
      provider_address: provAddress.trim() || null,
      provider_rep_name: provRepName.trim() || null,
      provider_rep_title: provRepTitle.trim() || null,
      provider_phone: provPhone.trim() || null,
      provider_email: provEmail.trim() || null,

      client_name: clientName.trim(),
      client_id_number: clientIdNumber.trim() || null,
      client_address: clientAddress.trim() || null,
      client_rep_name: clientRepName.trim() || null,
      client_rep_title: clientRepTitle.trim() || null,
      client_phone: clientPhone.trim() || null,
      client_email: clientEmail.trim() || null,

      property_name: propertyName.trim() || null,
      property_location: propertyLocation.trim() || null,
      shoot_date: shootDate || null,
      shoot_time: shootTime.trim() || null,
      site_contact_name: siteContactName.trim() || null,
      site_contact_phone: siteContactPhone.trim() || null,

      items,
      discount_pct: discountPct,
      discount_amount: totals.discountAmount,
      subtotal: totals.subtotal,
      vat_enabled: vatEnabled,
      vat_pct: vatPct,
      vat_amount: totals.vatAmount,
      total: totals.total,
      deposit_pct: depositPct,
      deposit_amount: totals.depositAmount,
      balance_amount: totals.balanceAmount,
      balance_due_on: balanceDueOn.trim() || null,

      revision_rounds: revisionRounds,
      delivery_format: deliveryFormat.trim(),
      platforms: platforms.trim() || null,
      raw_files_included: rawFilesIncluded,
      raw_files_price: rawFilesPrice,
      travel_fee_included: travelFeeIncluded,
      travel_fee: travelFee,
      reschedule_terms: rescheduleTerms.trim() || null,

      portfolio_usage: portfolioUsage,
      notes: notes.trim() || null,
      clauses,
      quotation_id: record?.quotation_id ?? fromQuotation?.id ?? null,
    }

    const { data, error } = record
      ? await supabase.from('contracts').update(payload).eq('id', record.id).select().single()
      : await supabase.from('contracts')
          .insert({ ...payload, contract_number: numbers!.contract })
          .select().single()

    setSaving(false)
    if (error) { setError(error.message); return }
    if (data) {
      const row = data as Contract
      setRecord(row)
      if (!orderNumber && row.order_number) setOrderNumber(row.order_number)
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    onSaved()
  }

  function shareWhatsApp() {
    const phone = clientPhone.replace(/\D/g, '')
    const lines = [
      `*عقد خدمات تصوير — ${businessName || 'Enpho Studio'}*`,
      record?.contract_number ? `رقم العقد: ${record.contract_number}` : '',
      propertyName ? `العقار: ${propertyName}` : '',
      propertyLocation ? `الموقع: ${propertyLocation}` : '',
      shootDate ? `موعد التصوير: ${arDate(shootDate)}${shootTime ? ` — ${shootTime}` : ''}` : '',
      '',
      ...items.map(i => `• ${i.service} — ${formatSAR(i.price)} ر.س`),
      '',
      `الإجمالي قبل الضريبة: ${formatSAR(totals.afterDiscount)} ر.س`,
      vatEnabled ? `الضريبة (${vatPct}%): ${formatSAR(totals.vatAmount)} ر.س` : '',
      `*الإجمالي النهائي: ${formatSAR(totals.total)} ر.س*`,
      `الدفعة المقدمة (${depositPct}%): ${formatSAR(totals.depositAmount)} ر.س`,
      `الرصيد: ${formatSAR(totals.balanceAmount)} ر.س${balanceDueOn ? ` — يستحق عند ${balanceDueOn}` : ''}`,
      '',
      'نسخة العقد الكاملة مرفقة بصيغة PDF للمراجعة والتوقيع.',
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
              {isNew ? 'عقد جديد' : `تعديل ${record!.contract_number}`}
            </h1>
            <p className="text-gray-400 mt-0.5 text-sm">
              {fromQuotation
                ? `محوَّل من عرض السعر ${fromQuotation.quote_number}`
                : clientName || 'املأ بيانات العقد وأرسله للعميل للتوقيع'}
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
            ) : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ' : 'حفظ العقد'}
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

          {/* بيانات العقد */}
          <Section icon={FileSignature} title="بيانات العقد">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="رقم العقد" hint={isNew ? 'يُولَّد تلقائياً عند الحفظ' : undefined}>
                <input value={record?.contract_number ?? 'يُولَّد عند الحفظ'} disabled
                  className={`${inputClass} disabled:opacity-50`} />
              </Field>
              <Field label="رقم الطلب" hint="ENP-WO-… — يُولَّد تلقائياً ويمكن تعديله">
                <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)}
                  dir="ltr" placeholder="ENP-WO-2026-0001" className={inputClass} />
              </Field>
              <Field label="تاريخ التوقيع">
                <input type="date" value={signDate} onChange={e => setSignDate(e.target.value)}
                  className={inputClass} />
              </Field>
              <Field label="مدينة التوقيع">
                <input value={signCity} onChange={e => setSignCity(e.target.value)}
                  placeholder="الرياض" className={inputClass} />
              </Field>
              <Field label="مدة العقد — من">
                <input type="date" value={durationFrom} onChange={e => setDurationFrom(e.target.value)}
                  className={inputClass} />
              </Field>
              <Field label="مدة العقد — إلى">
                <input type="date" value={durationTo} onChange={e => setDurationTo(e.target.value)}
                  className={inputClass} />
              </Field>
              <Field label="حالة العقد">
                <select value={status} onChange={e => setStatus(e.target.value as ContractStatus)}
                  className={inputClass}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value} className="bg-[#0f0f16]">{s.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* الطرف الأول */}
          <Section icon={Building2} title="الطرف الأول — مقدم الخدمة"
            subtitle="يُملأ تلقائياً من إعدادات الموقع، ويمكن تعديله لهذا العقد">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="الاسم النظامي">
                <input value={provLegalName} onChange={e => setProvLegalName(e.target.value)}
                  placeholder="مؤسسة إنفو ستوديو للتصوير" className={inputClass} />
              </Field>
              <Field label="السجل / وثيقة العمل">
                <input value={provRegistration} onChange={e => setProvRegistration(e.target.value)}
                  dir="ltr" placeholder="1010xxxxxx" className={inputClass} />
              </Field>
              <Field label="العنوان">
                <input value={provAddress} onChange={e => setProvAddress(e.target.value)}
                  placeholder="مدينة الرياض — حي …" className={inputClass} />
              </Field>
              <Field label="الممثل">
                <input value={provRepName} onChange={e => setProvRepName(e.target.value)}
                  placeholder="عبدالرحمن …" className={inputClass} />
              </Field>
              <Field label="صفة الممثل">
                <input value={provRepTitle} onChange={e => setProvRepTitle(e.target.value)}
                  placeholder="مالك المنشأة" className={inputClass} />
              </Field>
              <Field label="الجوال">
                <input value={provPhone} onChange={e => setProvPhone(e.target.value)}
                  dir="ltr" placeholder="966555555555" className={inputClass} />
              </Field>
              <Field label="البريد">
                <input value={provEmail} onChange={e => setProvEmail(e.target.value)}
                  dir="ltr" placeholder="info@enpho.studio" className={inputClass} />
              </Field>
            </div>
          </Section>

          {/* الطرف الثاني */}
          <Section icon={User} title="الطرف الثاني — العميل">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="الاسم / المنشأة *">
                <input value={clientName} onChange={e => setClientName(e.target.value)}
                  placeholder="شركة التطوير العقاري" className={inputClass} />
              </Field>
              <Field label="الهوية / السجل">
                <input value={clientIdNumber} onChange={e => setClientIdNumber(e.target.value)}
                  dir="ltr" placeholder="1010xxxxxx" className={inputClass} />
              </Field>
              <Field label="العنوان">
                <input value={clientAddress} onChange={e => setClientAddress(e.target.value)}
                  placeholder="الرياض — حي …" className={inputClass} />
              </Field>
              <Field label="الممثل">
                <input value={clientRepName} onChange={e => setClientRepName(e.target.value)}
                  placeholder="محمد العتيبي" className={inputClass} />
              </Field>
              <Field label="صفة الممثل">
                <input value={clientRepTitle} onChange={e => setClientRepTitle(e.target.value)}
                  placeholder="مدير التسويق" className={inputClass} />
              </Field>
              <Field label="الجوال" hint="بصيغة دولية للمشاركة عبر واتساب">
                <input value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                  dir="ltr" placeholder="966555555555" className={inputClass} />
              </Field>
              <Field label="البريد">
                <input value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                  dir="ltr" placeholder="client@example.com" className={inputClass} />
              </Field>
            </div>
          </Section>

          {/* بيانات المشروع */}
          <Section icon={Building2} title="بيانات المشروع"
            subtitle="تظهر في نموذج طلب الخدمة — الصفحة الثانية من العقد">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="اسم / نوع العقار">
                <input value={propertyName} onChange={e => setPropertyName(e.target.value)}
                  placeholder="مشروع 15 شقة — حي الياسمين" className={inputClass} />
              </Field>
              <Field label="الموقع">
                <input value={propertyLocation} onChange={e => setPropertyLocation(e.target.value)}
                  placeholder="الرياض" className={inputClass} />
              </Field>
              <Field label="تاريخ التصوير">
                <input type="date" value={shootDate} onChange={e => setShootDate(e.target.value)}
                  className={inputClass} />
              </Field>
              <Field label="ساعة التصوير">
                <input value={shootTime} onChange={e => setShootTime(e.target.value)}
                  placeholder="10:00 صباحاً" className={inputClass} />
              </Field>
              <Field label="جهة الاتصال بالموقع — الاسم">
                <input value={siteContactName} onChange={e => setSiteContactName(e.target.value)}
                  placeholder="سعد" className={inputClass} />
              </Field>
              <Field label="جهة الاتصال بالموقع — الجوال">
                <input value={siteContactPhone} onChange={e => setSiteContactPhone(e.target.value)}
                  dir="ltr" placeholder="0555555555" className={inputClass} />
              </Field>
            </div>
          </Section>

          {/* جدول الخدمات */}
          <section className="bg-[#1a1a24] rounded-2xl border border-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-white font-bold">جدول الخدمات</h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  {fromQuotation
                    ? 'منقولة من عرض السعر — عدّلها كما تشاء'
                    : 'الخدمة، المواصفات، مدة التسليم، والسعر'}
                </p>
              </div>
              <button
                onClick={() => setItems(prev => [...prev, newContractItem()])}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
              >
                <Plus className="w-4 h-4" />
                خدمة
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-10">لا توجد خدمات بعد</p>
            ) : (
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="bg-[#0f0f16] rounded-xl border border-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <input
                          value={item.service}
                          onChange={e => editItem(item.id, { service: e.target.value })}
                          placeholder="اسم الخدمة — تصوير فوتوغرافي داخلي وخارجي"
                          className="w-full bg-transparent text-white font-bold text-sm focus:outline-none placeholder-gray-600"
                        />
                        <input
                          value={item.spec}
                          onChange={e => editItem(item.id, { spec: e.target.value })}
                          placeholder="المواصفات / الكمية — 10 صور للوحدة، معالجة متقدمة"
                          className="w-full bg-transparent text-gray-500 text-xs focus:outline-none placeholder-gray-700"
                        />
                      </div>
                      <button
                        onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                        title="حذف الخدمة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-white/5">
                      <label className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">مدة التسليم</span>
                        <input
                          value={item.delivery}
                          onChange={e => editItem(item.id, { delivery: e.target.value })}
                          placeholder="5 أيام عمل"
                          className="w-32 bg-[#1a1a24] border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#d4af37]/40"
                        />
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">السعر</span>
                        <input
                          type="number" min={0} value={item.price}
                          onChange={e => editItem(item.id, { price: Number(e.target.value) })}
                          className="w-32 bg-[#1a1a24] border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40"
                        />
                      </label>
                      <span className="mr-auto text-[#d4af37] font-bold text-sm">
                        {formatSAR(item.price)} ر.س
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* القيمة والدفعات */}
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
              <Field label="الدفعة المقدمة %">
                <input type="number" min={0} max={100} value={depositPct}
                  onChange={e => setDepositPct(Number(e.target.value))} className={inputClass} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="الرصيد يستحق عند">
                  <input value={balanceDueOn} onChange={e => setBalanceDueOn(e.target.value)}
                    placeholder="تسليم النسخ النهائية" className={inputClass} />
                </Field>
              </div>
            </div>
          </section>

          {/* شروط التنفيذ */}
          <Section icon={Scale} title="شروط التنفيذ">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="عدد جولات المراجعة">
                <input type="number" min={0} value={revisionRounds}
                  onChange={e => setRevisionRounds(Number(e.target.value))} className={inputClass} />
              </Field>
              <Field label="صيغة التسليم">
                <input value={deliveryFormat} onChange={e => setDeliveryFormat(e.target.value)}
                  placeholder="JPG / MP4 / رابط" className={inputClass} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="المقاسات والمنصات">
                  <input value={platforms} onChange={e => setPlatforms(e.target.value)}
                    placeholder="Instagram / TikTok / موقع العميل" className={inputClass} />
                </Field>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" checked={rawFilesIncluded}
                    onChange={e => setRawFilesIncluded(e.target.checked)}
                    className="w-4 h-4 accent-[#d4af37]" />
                  <span className="text-gray-300 text-sm">الملفات الخام مشمولة</span>
                </label>
                <input type="number" min={0} value={rawFilesPrice} disabled={!rawFilesIncluded}
                  onChange={e => setRawFilesPrice(Number(e.target.value))}
                  placeholder="سعر الملفات الخام"
                  className={`${inputClass} disabled:opacity-40`} />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" checked={travelFeeIncluded}
                    onChange={e => setTravelFeeIncluded(e.target.checked)}
                    className="w-4 h-4 accent-[#d4af37]" />
                  <span className="text-gray-300 text-sm">رسوم الانتقال مشمولة</span>
                </label>
                <input type="number" min={0} value={travelFee} disabled={travelFeeIncluded}
                  onChange={e => setTravelFee(Number(e.target.value))}
                  placeholder="رسوم الانتقال"
                  className={`${inputClass} disabled:opacity-40`} />
              </div>

              <div className="sm:col-span-2">
                <Field label="إعادة الجدولة" hint="اتركه فارغاً ليُطبع «وفق العقد»">
                  <input value={rescheduleTerms} onChange={e => setRescheduleTerms(e.target.value)}
                    placeholder="شرط خاص لإعادة الجدولة" className={inputClass} />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="استخدام الأعمال في ملف الأعمال والمعارض"
                  hint="يُطبع تحت بند «تاسعًا: حقوق الملكية والاستخدام»">
                  <select value={portfolioUsage}
                    onChange={e => setPortfolioUsage(e.target.value as PortfolioUsage)}
                    className={inputClass}>
                    {PORTFOLIO_USAGE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value} className="bg-[#0f0f16]">{o.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="ملاحظات ونطاق خاص">
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                    placeholder="أي استثناءات أو اتفاقات خاصة تظهر في نموذج طلب الخدمة"
                    className={`${inputClass} resize-y`} />
                </Field>
              </div>
            </div>
          </Section>
        </div>

        {/* ── Right: summary ──────────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="xl:sticky xl:top-6 space-y-6">

            <section className="bg-[#1a1a24] rounded-2xl border border-white/5 p-6">
              <h2 className="text-white font-bold mb-4">القيمة والدفعات</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>المجموع</span>
                  <span className="text-gray-200">{formatSAR(totals.subtotal)} ر.س</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>خصم {discountPct}%</span>
                    <span className="text-red-400">- {formatSAR(totals.discountAmount)} ر.س</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>الإجمالي قبل الضريبة</span>
                  <span className="text-gray-200">{formatSAR(totals.afterDiscount)} ر.س</span>
                </div>
                {vatEnabled && (
                  <div className="flex justify-between text-gray-400">
                    <span>الضريبة {vatPct}%</span>
                    <span className="text-gray-200">{formatSAR(totals.vatAmount)} ر.س</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 mt-1 border-t border-white/10">
                  <span className="text-white font-bold">الإجمالي النهائي</span>
                  <span className="text-[#d4af37] font-black text-lg">
                    {formatSAR(totals.total)} ر.س
                  </span>
                </div>
                <div className="flex justify-between pt-3 text-gray-400">
                  <span>الدفعة المقدمة {depositPct}%</span>
                  <span className="text-gray-200">{formatSAR(totals.depositAmount)} ر.س</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>الرصيد</span>
                  <span className="text-gray-200">{formatSAR(totals.balanceAmount)} ر.س</span>
                </div>
              </div>
            </section>

            <section className="bg-[#1a1a24] rounded-2xl border border-white/5 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-[#d4af37]" />
                <h2 className="text-white font-bold text-sm">البنود المطبوعة</h2>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed">
                {clauses.length > 0
                  ? `${clauses.length} بنداً محفوظاً مع هذا العقد. تُطبع كما هي حتى لو عُدّلت البنود العامة لاحقاً.`
                  : 'لا توجد بنود محفوظة — أضف البنود من صفحة «بنود العقد» ثم أنشئ العقد من جديد.'}
              </p>
            </section>

            <div className="flex gap-2.5 bg-[#d4af37]/8 border border-[#d4af37]/20 rounded-xl px-4 py-3">
              <Scale className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <p className="text-gray-400 text-xs leading-relaxed">
                هذا نموذج تجاري عام لتنظيم العلاقة التشغيلية، وليس رأياً قانونياً. راجع
                الصياغة النهائية مع محامٍ مرخص في المملكة — خصوصاً حدود المسؤولية والضرائب
                والتراخيص والاختصاص القضائي.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Printable version */}
      <ContractPrint data={printData} />
    </div>
  )
}
