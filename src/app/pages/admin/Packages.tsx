import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Star, StarOff, X, Package } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Package as PackageType } from '../../../lib/types'

interface EditablePackage extends PackageType {
  _dirty: boolean
  _saving: boolean
  _newFeature: string
}

export default function Packages() {
  const [packages, setPackages] = useState<EditablePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchPackages()
  }, [])

  async function fetchPackages() {
    setLoading(true)
    const { data } = await supabase
      .from('packages')
      .select('*')
      .order('sort_order')

    if (data) {
      setPackages(data.map(p => ({ ...p, _dirty: false, _saving: false, _newFeature: '' })))
    }
    setLoading(false)
  }

  function updateField<K extends keyof PackageType>(id: string, field: K, value: PackageType[K]) {
    setPackages(prev => prev.map(p =>
      p.id === id ? { ...p, [field]: value, _dirty: true } : p
    ))
  }

  function updateNewFeature(id: string, value: string) {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, _newFeature: value } : p))
  }

  function addFeature(id: string) {
    setPackages(prev => prev.map(p => {
      if (p.id !== id || !p._newFeature.trim()) return p
      return { ...p, features: [...p.features, p._newFeature.trim()], _newFeature: '', _dirty: true }
    }))
  }

  function removeFeature(id: string, index: number) {
    setPackages(prev => prev.map(p =>
      p.id === id
        ? { ...p, features: p.features.filter((_, i) => i !== index), _dirty: true }
        : p
    ))
  }

  async function savePackage(pkg: EditablePackage) {
    setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, _saving: true } : p))

    const { error } = await supabase.from('packages').update({
      name: pkg.name,
      price: pkg.price,
      features: pkg.features,
      is_popular: pkg.is_popular,
      is_active: pkg.is_active,
    }).eq('id', pkg.id)

    if (error) {
      console.error('Save failed:', error.message)
    }

    setPackages(prev => prev.map(p =>
      p.id === pkg.id ? { ...p, _dirty: false, _saving: false } : p
    ))
  }

  async function togglePopular(id: string) {
    // Only one can be popular at a time
    setPackages(prev => prev.map(p => ({
      ...p,
      is_popular: p.id === id ? !p.is_popular : false,
      _dirty: true,
    })))
  }

  async function deletePackage(pkg: EditablePackage) {
    if (!window.confirm(`هل تريد حذف "${pkg.name}" نهائياً؟`)) return
    await supabase.from('packages').delete().eq('id', pkg.id)
    setPackages(prev => prev.filter(p => p.id !== pkg.id))
  }

  async function addNewPackage() {
    setAdding(true)
    const { data } = await supabase.from('packages').insert({
      name: 'باقة جديدة',
      price: 0,
      features: ['ميزة 1'],
      is_popular: false,
      is_active: true,
      sort_order: packages.length,
    }).select().single()

    if (data) {
      setPackages(prev => [...prev, { ...data, _dirty: false, _saving: false, _newFeature: '' }])
    }
    setAdding(false)
  }

  if (loading) {
    return (
      <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
        <div className="h-8 w-48 bg-[#1a1a24] rounded-xl animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-96 bg-[#1a1a24] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة الباقات</h1>
          <p className="text-gray-400 mt-1">{packages.length} باقات — عدّل الأسعار والمميزات مباشرة</p>
        </div>
        <button
          onClick={addNewPackage}
          disabled={adding}
          className="flex items-center gap-2 bg-[#1a1a24] border border-[#d4af37]/30 hover:border-[#d4af37] text-[#d4af37] px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          باقة جديدة
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-24 text-gray-500 bg-[#1a1a24] rounded-2xl border border-white/5">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">لا توجد باقات</p>
          <p className="text-sm mt-1">أضف باقة جديدة من الزر أعلاه</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <div
              key={pkg.id}
              className={`relative bg-[#1a1a24] rounded-2xl border-2 transition-all flex flex-col ${
                pkg.is_popular
                  ? 'border-[#d4af37]/60 shadow-lg shadow-[#d4af37]/10'
                  : 'border-white/5'
              }`}
            >
              {/* Popular badge */}
              {pkg.is_popular && (
                <div className="absolute -top-3 right-1/2 translate-x-1/2 bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] px-4 py-1 rounded-full text-xs font-bold">
                  الأكثر طلباً
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col gap-5">
                {/* Package Name */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">اسم الباقة</label>
                  <input
                    value={pkg.name}
                    onChange={e => updateField(pkg.id, 'name', e.target.value)}
                    className="w-full bg-[#0f0f16] border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-lg focus:outline-none focus:border-[#d4af37]/50 transition-colors"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">السعر (ريال)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={pkg.price}
                      onChange={e => updateField(pkg.id, 'price', Number(e.target.value))}
                      className="w-full bg-[#0f0f16] border border-white/10 rounded-xl px-3 py-2.5 text-[#d4af37] font-bold text-2xl focus:outline-none focus:border-[#d4af37]/50 transition-colors"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">ر.س</span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">المميزات</label>
                  <div className="space-y-2 mb-3">
                    {pkg.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 group">
                        <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full flex-shrink-0" />
                        <input
                          value={feature}
                          onChange={e => {
                            const updated = [...pkg.features]
                            updated[idx] = e.target.value
                            updateField(pkg.id, 'features', updated)
                          }}
                          className="flex-1 bg-transparent text-gray-300 text-sm focus:outline-none border-b border-transparent focus:border-[#d4af37]/30 transition-colors py-0.5"
                        />
                        <button
                          onClick={() => removeFeature(pkg.id, idx)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Feature */}
                  <div className="flex items-center gap-2">
                    <input
                      value={pkg._newFeature}
                      onChange={e => updateNewFeature(pkg.id, e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addFeature(pkg.id)}
                      placeholder="أضف ميزة جديدة..."
                      className="flex-1 bg-[#0f0f16] border border-dashed border-white/10 rounded-lg px-3 py-1.5 text-gray-400 text-sm placeholder-gray-600 focus:outline-none focus:border-[#d4af37]/30 transition-colors"
                    />
                    <button
                      onClick={() => addFeature(pkg.id)}
                      disabled={!pkg._newFeature.trim()}
                      className="w-8 h-8 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Row */}
              <div className="px-6 pb-6 flex items-center gap-2 border-t border-white/5 pt-4 mt-auto">
                {/* Popular toggle */}
                <button
                  onClick={() => togglePopular(pkg.id)}
                  title={pkg.is_popular ? 'إلغاء الأكثر طلباً' : 'تعيين كالأكثر طلباً'}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    pkg.is_popular
                      ? 'bg-[#d4af37]/20 text-[#d4af37]'
                      : 'bg-white/5 text-gray-500 hover:text-[#d4af37] hover:bg-[#d4af37]/10'
                  }`}
                >
                  {pkg.is_popular ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => deletePackage(pkg)}
                  title="حذف الباقة"
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Save */}
                <button
                  onClick={() => savePackage(pkg)}
                  disabled={!pkg._dirty || pkg._saving}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${
                    pkg._dirty
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] hover:opacity-90'
                      : 'bg-white/5 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {pkg._saving ? (
                    <span className="w-4 h-4 border-2 border-[#0a0a0f]/30 border-t-[#0a0a0f] rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {pkg._saving ? 'جاري الحفظ...' : pkg._dirty ? 'حفظ التغييرات' : 'محفوظ'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
