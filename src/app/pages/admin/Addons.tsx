import { useEffect, useState } from 'react'
import {
  Plus, Trash2, Save, Eye, EyeOff, ArrowUp, ArrowDown, Sparkles, CheckCircle,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Addon, AddonPricing } from '../../../lib/catalog'

type EditableAddon = Omit<Addon, 'created_at' | 'sort_order'> & { isNew: boolean }

let tempCounter = 0

const blankAddon = (): EditableAddon => ({
  id: `new-${tempCounter++}`,
  name: '',
  description: null,
  pricing_type: 'unit',
  unit_label: null,
  price: 0,
  price_max: null,
  delivery: null,
  is_active: true,
  isNew: true,
})

const inputClass =
  'w-full bg-[#0f0f16] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#d4af37]/40 transition-colors'

function Label({ children }: { children: React.ReactNode }) {
  return <span className="block text-gray-500 text-xs mb-1">{children}</span>
}

/** الخدمات الإضافية — تُختار في عروض الأسعار والعقود، والمفعّلة منها تظهر في صفحة الباقات بالموقع */
export default function Addons() {
  const [addons, setAddons] = useState<EditableAddon[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchAddons() }, [])

  async function fetchAddons() {
    setLoading(true)
    const { data, error } = await supabase.from('addons').select('*').order('sort_order')
    if (error) setError(error.message)
    else setAddons((data as Addon[]).map(a => ({ ...a, isNew: false })))
    setDeletedIds([])
    setDirty(false)
    setLoading(false)
  }

  function patch(id: string, p: Partial<EditableAddon>) {
    setAddons(prev => prev.map(a => a.id === id ? { ...a, ...p } : a))
    setDirty(true)
    setSaved(false)
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= addons.length) return
    setAddons(prev => {
      const updated = [...prev]
      const [item] = updated.splice(index, 1)
      updated.splice(target, 0, item)
      return updated
    })
    setDirty(true)
  }

  function remove(a: EditableAddon) {
    setAddons(prev => prev.filter(x => x.id !== a.id))
    if (!a.isNew) setDeletedIds(prev => [...prev, a.id])
    setDirty(true)
  }

  async function save() {
    if (addons.some(a => !a.name.trim())) { setError('اسم الإضافة مطلوب'); return }
    setSaving(true)
    setError(null)

    if (deletedIds.length > 0) {
      const { error } = await supabase.from('addons').delete().in('id', deletedIds)
      if (error) { setError(error.message); setSaving(false); return }
    }

    const row = (a: EditableAddon, index: number) => ({
      name: a.name.trim(),
      description: a.description?.trim() || null,
      pricing_type: a.pricing_type,
      unit_label: a.pricing_type === 'unit' ? a.unit_label?.trim() || null : null,
      price: a.price,
      price_max: a.price_max,
      delivery: a.delivery?.trim() || null,
      is_active: a.is_active,
      sort_order: index,
    })

    for (const [index, a] of addons.entries()) {
      if (a.isNew) continue
      const { error } = await supabase.from('addons').update(row(a, index)).eq('id', a.id)
      if (error) { setError(error.message); setSaving(false); return }
    }

    const inserts = addons.map((a, i) => ({ a, i })).filter(({ a }) => a.isNew).map(({ a, i }) => row(a, i))
    if (inserts.length > 0) {
      const { error } = await supabase.from('addons').insert(inserts)
      if (error) { setError(error.message); setSaving(false); return }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    await fetchAddons()
  }

  if (loading) {
    return (
      <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
        <div className="h-8 w-56 bg-[#1a1a24] rounded-xl animate-pulse mb-8" />
        <div className="space-y-3 max-w-4xl">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-[#1a1a24] rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">الخدمات الإضافية</h1>
          <p className="text-gray-400 mt-1">
            {addons.length} إضافة — تُختار في عروض الأسعار والعقود، والمفعّلة تظهر في صفحة الباقات
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
          ) : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ' : dirty ? 'حفظ التغييرات' : 'محفوظ'}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm max-w-4xl">
          {error}
        </div>
      )}

      <div className="max-w-4xl space-y-3">
        {addons.length === 0 && (
          <div className="text-center py-16 text-gray-500 bg-[#1a1a24] rounded-2xl border border-white/5">
            <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">لا توجد إضافات</p>
            <p className="text-sm mt-1">أضف إضافة جديدة من الزر أدناه</p>
          </div>
        )}

        {addons.map((a, index) => {
          const isPercent = a.pricing_type === 'percent'
          return (
            <div
              key={a.id}
              className={`bg-[#1a1a24] rounded-2xl border border-white/5 p-5 transition-opacity ${a.is_active ? '' : 'opacity-50'}`}
            >
              <div className="flex items-start gap-3">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 pt-6 flex-shrink-0">
                  <button onClick={() => move(index, -1)} disabled={index === 0} title="تحريك لأعلى"
                    className="text-gray-600 hover:text-[#d4af37] transition-colors disabled:opacity-20">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => move(index, 1)} disabled={index === addons.length - 1} title="تحريك لأسفل"
                    className="text-gray-600 hover:text-[#d4af37] transition-colors disabled:opacity-20">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-2 sm:grid-cols-6 gap-3">
                  <label className="col-span-2 sm:col-span-3">
                    <Label>الاسم</Label>
                    <input value={a.name} onChange={e => patch(a.id, { name: e.target.value })}
                      placeholder="Drone Photography" className={`${inputClass} font-bold`} />
                  </label>
                  <label className="col-span-2 sm:col-span-3">
                    <Label>الوصف (يظهر في المواصفات)</Label>
                    <input value={a.description ?? ''} onChange={e => patch(a.id, { description: e.target.value })}
                      placeholder="اختياري" className={inputClass} />
                  </label>

                  <label className="sm:col-span-2">
                    <Label>طريقة التسعير</Label>
                    <select value={a.pricing_type}
                      onChange={e => patch(a.id, { pricing_type: e.target.value as AddonPricing })}
                      className={inputClass}>
                      <option value="unit" className="bg-[#0f0f16]">بالعدد</option>
                      <option value="percent" className="bg-[#0f0f16]">نسبة % من الإجمالي</option>
                    </select>
                  </label>
                  {!isPercent && (
                    <label>
                      <Label>الوحدة</Label>
                      <input value={a.unit_label ?? ''} onChange={e => patch(a.id, { unit_label: e.target.value })}
                        placeholder="خدمة / صورة / م²" className={inputClass} />
                    </label>
                  )}
                  <label className={isPercent ? 'sm:col-span-2' : ''}>
                    <Label>{isPercent ? 'النسبة من %' : 'السعر من'}</Label>
                    <input type="number" min={0} value={a.price}
                      onChange={e => patch(a.id, { price: Number(e.target.value) })} className={inputClass} />
                  </label>
                  <label>
                    <Label>{isPercent ? 'إلى %' : 'إلى'}</Label>
                    <input type="number" min={0} value={a.price_max ?? ''} placeholder="—"
                      onChange={e => patch(a.id, { price_max: e.target.value === '' ? null : Number(e.target.value) })}
                      className={inputClass} />
                  </label>
                  <label>
                    <Label>مدة التسليم</Label>
                    <input value={a.delivery ?? ''} onChange={e => patch(a.id, { delivery: e.target.value })}
                      placeholder="—" className={inputClass} />
                  </label>
                </div>

                <div className="flex flex-col gap-2 pt-5 flex-shrink-0">
                  <button
                    onClick={() => patch(a.id, { is_active: !a.is_active })}
                    title={a.is_active ? 'إخفاء من الاختيارات' : 'إظهار في الاختيارات'}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      a.is_active ? 'bg-[#d4af37]/10 text-[#d4af37]' : 'bg-white/5 text-gray-600 hover:text-gray-400'
                    }`}
                  >
                    {a.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => remove(a)}
                    title="حذف الإضافة"
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        <button
          onClick={() => { setAddons(prev => [...prev, blankAddon()]); setDirty(true) }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-white/10 text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37]/30 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          إضافة جديدة
        </button>

        <p className="text-gray-600 text-xs pt-1">
          «بالعدد»: السعر × العدد — مثل الدرون (خدمة)، Virtual Staging (صورة)، 3D (م² بسعر المتر).
          «نسبة %»: تُحسب من قيمة الباقة والإضافات — مثل التسليم السريع.
          الأسعار هنا مقترحة، ويمكن تعديلها داخل كل عرض أو عقد. لا تُحفظ التغييرات حتى تضغط «حفظ التغييرات».
        </p>
      </div>
    </div>
  )
}
