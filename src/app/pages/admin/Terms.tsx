import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Eye, EyeOff, ArrowUp, ArrowDown, ScrollText, CheckCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { TermsCondition } from '../../../lib/types'

interface EditableTerm {
  id: string          // real uuid, or `new-<n>` for rows not yet inserted
  text: string
  is_active: boolean
  isNew: boolean
}

let tempCounter = 0

export default function Terms() {
  const [terms, setTerms] = useState<EditableTerm[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [newItem, setNewItem] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTerms()
  }, [])

  async function fetchTerms() {
    setLoading(true)
    const { data, error } = await supabase
      .from('terms_conditions')
      .select('*')
      .order('sort_order')

    if (error) {
      setError(error.message)
    } else if (data) {
      setTerms((data as TermsCondition[]).map(t => ({
        id: t.id,
        text: t.text,
        is_active: t.is_active,
        isNew: false,
      })))
    }
    setDeletedIds([])
    setDirty(false)
    setLoading(false)
  }

  function markDirty() {
    setDirty(true)
    setSaved(false)
  }

  function updateText(id: string, value: string) {
    setTerms(prev => prev.map(t => t.id === id ? { ...t, text: value } : t))
    markDirty()
  }

  function toggleActive(id: string) {
    setTerms(prev => prev.map(t => t.id === id ? { ...t, is_active: !t.is_active } : t))
    markDirty()
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= terms.length) return
    setTerms(prev => {
      const updated = [...prev]
      const [item] = updated.splice(index, 1)
      updated.splice(target, 0, item)
      return updated
    })
    markDirty()
  }

  function remove(id: string) {
    const term = terms.find(t => t.id === id)
    setTerms(prev => prev.filter(t => t.id !== id))
    if (term && !term.isNew) setDeletedIds(prev => [...prev, id])
    markDirty()
  }

  function add() {
    if (!newItem.trim()) return
    setTerms(prev => [...prev, {
      id: `new-${tempCounter++}`,
      text: newItem.trim(),
      is_active: true,
      isNew: true,
    }])
    setNewItem('')
    markDirty()
  }

  async function save() {
    setSaving(true)
    setError(null)

    // 1. Delete removed rows
    if (deletedIds.length > 0) {
      const { error } = await supabase.from('terms_conditions').delete().in('id', deletedIds)
      if (error) { setError(error.message); setSaving(false); return }
    }

    // 2. Update existing rows (text, order, visibility)
    for (const [index, term] of terms.entries()) {
      if (term.isNew) continue
      const { error } = await supabase.from('terms_conditions').update({
        text: term.text,
        sort_order: index,
        is_active: term.is_active,
      }).eq('id', term.id)
      if (error) { setError(error.message); setSaving(false); return }
    }

    // 3. Insert new rows
    const inserts = terms
      .map((t, index) => ({ t, index }))
      .filter(({ t }) => t.isNew)
      .map(({ t, index }) => ({
        text: t.text,
        sort_order: index,
        is_active: t.is_active,
      }))

    if (inserts.length > 0) {
      const { error } = await supabase.from('terms_conditions').insert(inserts)
      if (error) { setError(error.message); setSaving(false); return }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    await fetchTerms()
  }

  if (loading) {
    return (
      <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
        <div className="h-8 w-56 bg-[#1a1a24] rounded-xl animate-pulse mb-8" />
        <div className="space-y-3 max-w-3xl">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-[#1a1a24] rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">الشروط والأحكام</h1>
          <p className="text-gray-400 mt-1">
            {terms.length} بنود — تظهر أسفل قسم الباقات في الصفحة الرئيسية
          </p>
        </div>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className={`flex items-center gap-2 px-7 py-3 rounded-xl font-bold transition-all ${
            saved
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : dirty
              ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] hover:opacity-90 shadow-lg shadow-[#d4af37]/20'
              : 'bg-white/5 text-gray-500 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-[#0a0a0f]/30 border-t-[#0a0a0f] rounded-full animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ' : dirty ? 'حفظ التغييرات' : 'محفوظ'}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm max-w-3xl">
          {error}
        </div>
      )}

      <div className="max-w-3xl bg-[#1a1a24] rounded-2xl border border-white/5 p-6">
        {terms.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <ScrollText className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">لا توجد بنود</p>
            <p className="text-sm mt-1">أضف بنداً جديداً من الحقل أدناه</p>
          </div>
        ) : (
          <div className="space-y-2 mb-5">
            {terms.map((term, index) => (
              <div key={term.id} className="flex items-start gap-2 group">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 pt-1.5 flex-shrink-0">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    title="تحريك لأعلى"
                    className="text-gray-600 hover:text-[#d4af37] transition-colors disabled:opacity-20 disabled:hover:text-gray-600"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === terms.length - 1}
                    title="تحريك لأسفل"
                    className="text-gray-600 hover:text-[#d4af37] transition-colors disabled:opacity-20 disabled:hover:text-gray-600"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="flex-shrink-0 mt-3 text-[#d4af37] text-sm leading-none">◄</span>

                <textarea
                  value={term.text}
                  onChange={e => updateText(term.id, e.target.value)}
                  rows={1}
                  className={`flex-1 bg-[#0f0f16] border border-white/10 rounded-xl px-3 py-2.5 text-sm leading-relaxed resize-y min-h-[44px] focus:outline-none focus:border-[#d4af37]/40 transition-colors ${
                    term.is_active ? 'text-gray-200' : 'text-gray-600 line-through'
                  }`}
                />

                {/* Visibility */}
                <button
                  onClick={() => toggleActive(term.id)}
                  title={term.is_active ? 'إخفاء من الموقع' : 'إظهار في الموقع'}
                  className={`mt-1 w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                    term.is_active
                      ? 'bg-[#d4af37]/10 text-[#d4af37]'
                      : 'bg-white/5 text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {term.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => remove(term.id)}
                  title="حذف البند"
                  className="mt-1 w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new */}
        <div className="flex items-center gap-2">
          <input
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="أضف بنداً جديداً..."
            className="flex-1 bg-[#0f0f16] border border-dashed border-white/10 rounded-xl px-4 py-2.5 text-gray-300 text-sm placeholder-gray-600 focus:outline-none focus:border-[#d4af37]/30 transition-colors"
          />
          <button
            onClick={add}
            disabled={!newItem.trim()}
            className="w-10 h-10 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] rounded-xl flex items-center justify-center transition-colors disabled:opacity-30 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <p className="text-gray-600 text-xs mt-4">
          البنود المخفية تبقى محفوظة هنا لكنها لا تظهر للزوار. لا تُحفظ أي تغييرات حتى تضغط «حفظ التغييرات».
        </p>
      </div>
    </div>
  )
}
