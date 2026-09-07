import { useEffect, useState } from 'react'
import {
  ArrowRight, Plus, Trash2, Save, ArrowUp, ArrowDown,
  Eye, EyeOff, CheckCircle, Scale,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { ContractClause } from '../../../lib/types'

interface EditableClause {
  id: string        // real uuid, or `new-<n>` for rows not yet inserted
  slug: string | null
  title: string
  body: string
  is_active: boolean
  isNew: boolean
}

let tempCounter = 0

const inputClass =
  'w-full bg-[#0f0f16] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#d4af37]/40 transition-colors'

/**
 * البنود الثابتة التي تُطبع في كل عقد. تعديلها هنا يسري على العقود الجديدة فقط —
 * كل عقد يحتفظ بنسخة من البنود كما كانت يوم إصداره.
 */
export default function ContractClauses({ onBack }: { onBack: () => void }) {
  const [clauses, setClauses] = useState<EditableClause[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('contract_clauses')
      .select('*')
      .order('sort_order')

    if (error) setError(error.message)
    else if (data) {
      setClauses((data as ContractClause[]).map(c => ({
        id: c.id, slug: c.slug, title: c.title, body: c.body,
        is_active: c.is_active, isNew: false,
      })))
    }
    setDeletedIds([])
    setDirty(false)
    setLoading(false)
  }

  function markDirty() { setDirty(true); setSaved(false) }

  function patch(id: string, next: Partial<EditableClause>) {
    setClauses(prev => prev.map(c => c.id === id ? { ...c, ...next } : c))
    markDirty()
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= clauses.length) return
    setClauses(prev => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    markDirty()
  }

  function remove(id: string) {
    const clause = clauses.find(c => c.id === id)
    if (!clause) return
    if (!window.confirm(`حذف البند «${clause.title || 'بدون عنوان'}»؟`)) return
    if (!clause.isNew) setDeletedIds(prev => [...prev, id])
    setClauses(prev => prev.filter(c => c.id !== id))
    markDirty()
  }

  function add() {
    const id = `new-${tempCounter++}`
    setClauses(prev => [...prev, {
      id, slug: null, title: '', body: '', is_active: true, isNew: true,
    }])
    setOpenId(id)
    markDirty()
  }

  async function save() {
    setSaving(true)
    setError(null)

    if (deletedIds.length) {
      const { error } = await supabase.from('contract_clauses').delete().in('id', deletedIds)
      if (error) { setError(error.message); setSaving(false); return }
    }

    const existing = clauses.filter(c => !c.isNew)
    const fresh    = clauses.filter(c => c.isNew)

    // sort_order يتبع ترتيب العرض الحالي
    const orderOf = (id: string) => clauses.findIndex(c => c.id === id)

    if (existing.length) {
      const { error } = await supabase.from('contract_clauses').upsert(
        existing.map(c => ({
          id: c.id, slug: c.slug, title: c.title, body: c.body,
          is_active: c.is_active, sort_order: orderOf(c.id),
        })),
      )
      if (error) { setError(error.message); setSaving(false); return }
    }

    if (fresh.length) {
      const { error } = await supabase.from('contract_clauses').insert(
        fresh.map(c => ({
          slug: c.slug, title: c.title, body: c.body,
          is_active: c.is_active, sort_order: orderOf(c.id),
        })),
      )
      if (error) { setError(error.message); setSaving(false); return }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    await load()
  }

  if (loading) {
    return (
      <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
        <div className="h-8 w-48 bg-[#1a1a24] rounded-xl animate-pulse mb-8" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-[#1a1a24] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
            title="رجوع للعقود"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">بنود العقد</h1>
            <p className="text-gray-400 mt-0.5 text-sm">
              {clauses.length} بند — تُطبع في كل عقد جديد
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={add}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            بند جديد
          </button>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-40 ${
              saved
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] hover:opacity-90 shadow-lg shadow-[#d4af37]/20'
            }`}
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-[#0a0a0f]/30 border-t-[#0a0a0f] rounded-full animate-spin" />
            ) : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ' : 'حفظ البنود'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="mb-6 flex gap-2.5 bg-[#d4af37]/8 border border-[#d4af37]/20 rounded-xl px-4 py-3">
        <Scale className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
        <p className="text-gray-400 text-xs leading-relaxed">
          تعديل البنود هنا يسري على العقود الجديدة فقط. كل عقد محفوظ يحتفظ بنسخة من
          البنود كما كانت يوم إصداره، فلا تتغير عقود سابقة أُرسلت للعملاء.
        </p>
      </div>

      {/* Clauses */}
      <div className="space-y-3">
        {clauses.map((c, i) => {
          const open = openId === c.id
          return (
            <div
              key={c.id}
              className={`bg-[#1a1a24] rounded-2xl border transition-all ${
                open ? 'border-[#d4af37]/30' : 'border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3 p-4">
                <span className="w-7 h-7 rounded-lg bg-white/5 text-gray-500 text-xs flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>

                <button
                  onClick={() => setOpenId(open ? null : c.id)}
                  className="flex-1 min-w-0 text-right"
                >
                  <p className={`font-bold text-sm truncate ${c.is_active ? 'text-white' : 'text-gray-600 line-through'}`}>
                    {c.title || 'بند بدون عنوان'}
                  </p>
                  <p className="text-gray-600 text-xs truncate mt-0.5">
                    {c.body.split('\n')[0] || 'لا يوجد نص'}
                  </p>
                </button>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => move(i, -1)} disabled={i === 0}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-white disabled:opacity-20 transition-all">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === clauses.length - 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-white disabled:opacity-20 transition-all">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => patch(c.id, { is_active: !c.is_active })}
                    title={c.is_active ? 'إخفاء البند من العقود' : 'إظهار البند'}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-[#d4af37] transition-all"
                  >
                    {c.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => remove(c.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {open && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/5">
                  <label className="block">
                    <span className="block text-gray-300 text-sm mb-1.5">عنوان البند</span>
                    <input
                      value={c.title}
                      onChange={e => patch(c.id, { title: e.target.value })}
                      placeholder="مثال: سابعًا: الإلغاء وإعادة الجدولة"
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="block text-gray-300 text-sm mb-1.5">نص البند</span>
                    <textarea
                      value={c.body}
                      onChange={e => patch(c.id, { body: e.target.value })}
                      rows={7}
                      className={`${inputClass} resize-y leading-relaxed`}
                    />
                    <span className="block text-gray-600 text-xs mt-1">
                      كل سطر يبدأ بشرطة (-) يُطبع كنقطة في قائمة
                    </span>
                  </label>
                  {c.slug && (
                    <p className="text-gray-600 text-xs">
                      المعرّف الثابت: <code className="text-gray-500">{c.slug}</code>
                      {c.slug === 'ip_usage' && ' — يُطبع تحته خيار استخدام الأعمال في البورتفوليو'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {clauses.length === 0 && (
        <div className="bg-[#1a1a24] rounded-2xl border border-white/5 text-center py-20 text-gray-500">
          <Scale className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">لا توجد بنود</p>
          <p className="text-sm mt-1">شغّل ملف الترحيل 0003 لاستيراد بنود النموذج الأصلي</p>
        </div>
      )}
    </div>
  )
}
