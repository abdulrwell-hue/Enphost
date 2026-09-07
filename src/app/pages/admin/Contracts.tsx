import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, FileSignature, Trash2, Search, Scale, ReceiptText } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Contract, Quotation } from '../../../lib/types'
import { formatSAR } from '../../../lib/pricing'
import type { ContractStatus } from '../../../lib/contracts'
import ContractEditor from './ContractEditor'
import ContractClauses from './ContractClauses'

const STATUS_META: Record<ContractStatus, { label: string; className: string }> = {
  draft:     { label: 'مسودة', className: 'bg-white/5 text-gray-400' },
  sent:      { label: 'أُرسل', className: 'bg-blue-500/10 text-blue-400' },
  signed:    { label: 'موقّع', className: 'bg-green-500/10 text-green-400' },
  cancelled: { label: 'ملغي',  className: 'bg-red-500/10 text-red-400' },
}

const formatDate = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

type View =
  | { kind: 'list' }
  | { kind: 'clauses' }
  | { kind: 'editor'; contract: Contract | null; fromQuotation: Quotation | null }

export default function Contracts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all')
  const [view, setView] = useState<View>({ kind: 'list' })

  useEffect(() => { load() }, [])

  // «حوّل لعقد» من صفحة عروض الأسعار يصل عبر ?from=<quotationId>
  useEffect(() => {
    const from = searchParams.get('from')
    if (!from) return

    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('quotations').select('*').eq('id', from).maybeSingle()

      if (cancelled) return
      // الرابط استُهلك — لا يُعاد فتح المحرر عند تحديث الصفحة
      setSearchParams({}, { replace: true })

      if (error) { setError(error.message); return }
      if (!data) { setError('عرض السعر المطلوب غير موجود'); return }
      setView({ kind: 'editor', contract: null, fromQuotation: data as Quotation })
    })()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('contracts').select('*').order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setContracts((data ?? []) as Contract[])
    setLoading(false)
  }

  async function remove(ct: Contract) {
    if (!window.confirm(`هل تريد حذف العقد ${ct.contract_number} نهائياً؟`)) return
    const { error } = await supabase.from('contracts').delete().eq('id', ct.id)
    if (error) { setError(error.message); return }
    setContracts(prev => prev.filter(x => x.id !== ct.id))
  }

  const visible = contracts.filter(ct => {
    if (statusFilter !== 'all' && ct.status !== statusFilter) return false
    if (!query.trim()) return true
    const haystack = [ct.contract_number, ct.order_number, ct.client_name, ct.property_name]
      .filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  // ── Sub-views ─────────────────────────────────────────────────────────────
  if (view.kind === 'clauses') {
    return <ContractClauses onBack={() => setView({ kind: 'list' })} />
  }

  if (view.kind === 'editor') {
    return (
      <ContractEditor
        contract={view.contract}
        fromQuotation={view.fromQuotation}
        onBack={() => { setView({ kind: 'list' }); load() }}
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
          <h1 className="text-2xl font-bold text-white">العقود</h1>
          <p className="text-gray-400 mt-1">
            {contracts.length} عقد — املأ البيانات وأرسل العقد للعميل للتوقيع
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView({ kind: 'clauses' })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
          >
            <Scale className="w-4 h-4" />
            بنود العقد
          </button>
          <button
            onClick={() => setView({ kind: 'editor', contract: null, fromQuotation: null })}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] hover:opacity-90 shadow-lg shadow-[#d4af37]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            عقد جديد
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
            placeholder="ابحث برقم العقد أو اسم العميل أو العقار..."
            className="w-full bg-[#1a1a24] border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#d4af37]/40 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(['all', 'draft', 'sent', 'signed', 'cancelled'] as const).map(s => (
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
          <FileSignature className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">
            {contracts.length === 0 ? 'لا توجد عقود بعد' : 'لا نتائج مطابقة'}
          </p>
          <p className="text-sm mt-1">
            {contracts.length === 0
              ? 'أنشئ عقداً جديداً، أو حوّل عرض سعر قائم إلى عقد من صفحة عروض الأسعار'
              : 'جرّب كلمة بحث أخرى أو غيّر الفلتر'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(ct => (
            <div
              key={ct.id}
              className="group bg-[#1a1a24] rounded-2xl border border-white/5 hover:border-[#d4af37]/20 p-5 transition-all"
            >
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setView({ kind: 'editor', contract: ct, fromQuotation: null })}
                  className="flex-1 min-w-[200px] text-right"
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-white font-bold">{ct.client_name || '—'}</span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs ${STATUS_META[ct.status]?.className ?? ''}`}>
                      {STATUS_META[ct.status]?.label ?? ct.status}
                    </span>
                    {ct.quotation_id && (
                      <span
                        title="محوَّل من عرض سعر"
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-[#d4af37]/10 text-[#d4af37]"
                      >
                        <ReceiptText className="w-3 h-3" />
                        من عرض سعر
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    {ct.contract_number}
                    {ct.property_name ? ` — ${ct.property_name}` : ''}
                    {` — ${formatDate(ct.created_at)}`}
                  </p>
                </button>

                <div className="text-left">
                  <p className="text-[#d4af37] font-black text-lg">{formatSAR(ct.total)} ر.س</p>
                  <p className="text-gray-600 text-xs">
                    مقدم {formatSAR(ct.deposit_amount)} — رصيد {formatSAR(ct.balance_amount)}
                  </p>
                </div>

                <button
                  onClick={() => remove(ct)}
                  title="حذف العقد"
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
