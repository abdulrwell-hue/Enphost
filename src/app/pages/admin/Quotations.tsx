import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, FileText, Trash2, Copy, Search, SlidersHorizontal, FileSignature } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Quotation, QuotationStatus } from '../../../lib/types'
import { DEFAULT_PRICING, formatSAR, mergePricing, type PricingConfig } from '../../../lib/pricing'
import QuotationEditor from './QuotationEditor'
import QuotationPricingSettings, { PRICING_SETTINGS_KEY } from './QuotationPricingSettings'

const STATUS_META: Record<QuotationStatus, { label: string; className: string }> = {
  draft:    { label: 'مسودة',      className: 'bg-white/5 text-gray-400' },
  sent:     { label: 'أُرسل',       className: 'bg-blue-500/10 text-blue-400' },
  accepted: { label: 'مقبول',      className: 'bg-green-500/10 text-green-400' },
  rejected: { label: 'مرفوض',      className: 'bg-red-500/10 text-red-400' },
}

const formatDate = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export default function Quotations() {
  const navigate = useNavigate()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_PRICING)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'all'>('all')
  const [showPricingSettings, setShowPricingSettings] = useState(false)

  /** null = القائمة، undefined = عرض جديد، Quotation = تعديل */
  const [editing, setEditing] = useState<Quotation | null | undefined>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [quotesRes, settingsRes] = await Promise.all([
      supabase.from('quotations').select('*').order('created_at', { ascending: false }),
      supabase.from('site_settings').select('value').eq('key', PRICING_SETTINGS_KEY).maybeSingle(),
    ])

    if (quotesRes.error) setError(quotesRes.error.message)
    else setQuotations((quotesRes.data ?? []) as Quotation[])

    if (settingsRes.data?.value) {
      try {
        setConfig(mergePricing(JSON.parse(settingsRes.data.value)))
      } catch {
        setConfig(DEFAULT_PRICING)
      }
    }
    setLoading(false)
  }

  async function remove(q: Quotation) {
    if (!window.confirm(`هل تريد حذف العرض ${q.quote_number} نهائياً؟`)) return
    const { error } = await supabase.from('quotations').delete().eq('id', q.id)
    if (error) { setError(error.message); return }
    setQuotations(prev => prev.filter(x => x.id !== q.id))
  }

  /** ينسخ العرض كمسودة جديدة بدون رقم — يُحفظ برقم جديد */
  function duplicate(q: Quotation) {
    setEditing({ ...q, id: '', quote_number: '', status: 'draft' } as Quotation)
  }

  const visible = quotations.filter(q => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false
    if (!query.trim()) return true
    const haystack = [q.quote_number, q.client_name, q.client_company, q.project_name]
      .filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  // ── Editor ────────────────────────────────────────────────────────────────
  if (editing !== null) {
    const isDuplicate = editing !== undefined && !editing.id
    return (
      <QuotationEditor
        // نسخة مكرّرة تُعامل كعرض جديد لكن ببيانات مسبقة
        quotation={editing === undefined || isDuplicate ? null : editing}
        seed={isDuplicate ? editing : null}
        config={config}
        onConfigChange={setConfig}
        onBack={() => { setEditing(null); load() }}
        onSaved={load}
      />
    )
  }

  // ── List ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
        <div className="h-8 w-48 bg-[#1a1a24] rounded-xl animate-pulse mb-8" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-[#1a1a24] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">عروض الأسعار</h1>
          <p className="text-gray-400 mt-1">{quotations.length} عرض — أنشئ عرضاً وأرسله للعميل</p>
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
            onClick={() => setEditing(undefined)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] hover:opacity-90 shadow-lg shadow-[#d4af37]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            عرض سعر جديد
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ابحث برقم العرض أو اسم العميل أو المشروع..."
            className="w-full bg-[#1a1a24] border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#d4af37]/40 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(['all', 'draft', 'sent', 'accepted', 'rejected'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2 rounded-xl text-xs transition-all ${
                statusFilter === s
                  ? 'bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/20'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              {s === 'all' ? 'الكل' : STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="bg-[#1a1a24] rounded-2xl border border-white/5 text-center py-20 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">
            {quotations.length === 0 ? 'لا توجد عروض أسعار بعد' : 'لا نتائج مطابقة'}
          </p>
          <p className="text-sm mt-1">
            {quotations.length === 0
              ? 'ابدأ بإنشاء عرض سعر جديد — الحاسبة تقترح السعر تلقائياً'
              : 'جرّب كلمة بحث أخرى أو غيّر الفلتر'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(q => (
            <div
              key={q.id}
              className="group bg-[#1a1a24] rounded-2xl border border-white/5 hover:border-[#d4af37]/20 p-5 transition-all"
            >
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setEditing(q)}
                  className="flex-1 min-w-[200px] text-right"
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-white font-bold">{q.client_name || '—'}</span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs ${STATUS_META[q.status]?.className ?? ''}`}>
                      {STATUS_META[q.status]?.label ?? q.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    {q.quote_number}
                    {q.project_name ? ` — ${q.project_name}` : ''}
                    {` — ${formatDate(q.created_at)}`}
                  </p>
                </button>

                <div className="text-left">
                  <p className="text-[#d4af37] font-black text-lg">{formatSAR(q.total)} ريال</p>
                  <p className="text-gray-600 text-xs">
                    {q.vat_enabled ? 'شامل الضريبة' : 'غير شامل الضريبة'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => navigate(`/admin/contracts?from=${q.id}`)}
                    title="حوّل لعقد — تُنقل بيانات العميل والخدمات والأسعار"
                    className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-white/5 text-gray-500 hover:text-[#d4af37] hover:bg-[#d4af37]/10 text-xs transition-all"
                  >
                    <FileSignature className="w-4 h-4" />
                    حوّل لعقد
                  </button>
                  <button
                    onClick={() => duplicate(q)}
                    title="نسخ كعرض جديد"
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-gray-500 hover:text-[#d4af37] transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(q)}
                    title="حذف العرض"
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPricingSettings && (
        <QuotationPricingSettings
          config={config}
          onClose={() => setShowPricingSettings(false)}
          onSaved={setConfig}
        />
      )}
    </div>
  )
}
