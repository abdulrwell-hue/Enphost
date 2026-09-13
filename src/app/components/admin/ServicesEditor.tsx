import { useEffect, useMemo, useState } from 'react'
import { Check, Package as PackageIcon, Plus, Sparkles, Trash2, AlertTriangle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Package } from '../../../lib/types'
import {
  customItem, formatRange, formatSAR, itemFromAddon, itemFromPackage, lineAmount, servicesBase,
  type Addon, type ServiceItem,
} from '../../../lib/catalog'

interface Props {
  items: ServiceItem[]
  onChange: (items: ServiceItem[]) => void
}

const KIND_BADGE: Record<ServiceItem['kind'], { label: string; className: string }> = {
  package: { label: 'باقة',   className: 'bg-[#d4af37]/15 text-[#d4af37]' },
  addon:   { label: 'إضافة',  className: 'bg-blue-500/10 text-blue-400' },
  custom:  { label: 'يدوي',   className: 'bg-white/5 text-gray-400' },
}

const smallInput =
  'bg-[#1a1a24] border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#d4af37]/40'

const addonPriceHint = (a: Addon) =>
  a.pricing_type === 'percent'
    ? `+${formatRange(a.price, a.price_max, '%')}`
    : `${formatRange(a.price, a.price_max)}${a.unit_label ? ` / ${a.unit_label}` : ''}`

/**
 * اختيار الباقة والإضافات من الكتالوج — مشترك بين عروض الأسعار والعقود.
 * كل اختيار يصبح بنداً قابلاً للتعديل (السعر، المواصفات، مدة التسليم، الكمية).
 */
export default function ServicesEditor({ items, onChange }: Props) {
  const [packages, setPackages] = useState<Package[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('packages').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('addons').select('*').eq('is_active', true).order('sort_order'),
    ]).then(([pkgRes, addonRes]) => {
      setPackages((pkgRes.data ?? []) as Package[])
      setAddons((addonRes.data ?? []) as Addon[])
      setLoading(false)
    })
  }, [])

  const selectedPackageId = items.find(i => i.kind === 'package')?.refId ?? null
  const selectedAddonIds = new Set(items.filter(i => i.kind === 'addon').map(i => i.refId))
  const base = useMemo(() => servicesBase(items), [items])

  function selectPackage(pkg: Package) {
    const rest = items.filter(i => i.kind !== 'package')
    // الضغط على الباقة المختارة يلغي اختيارها
    onChange(pkg.id === selectedPackageId ? rest : [itemFromPackage(pkg), ...rest])
  }

  function toggleAddon(addon: Addon) {
    onChange(
      selectedAddonIds.has(addon.id)
        ? items.filter(i => !(i.kind === 'addon' && i.refId === addon.id))
        : [...items, itemFromAddon(addon)],
    )
  }

  function edit(id: string, patch: Partial<ServiceItem>) {
    onChange(items.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  if (loading) {
    return <div className="h-40 bg-[#0f0f16] rounded-xl animate-pulse" />
  }

  return (
    <div className="space-y-6">
      {/* Package */}
      <div>
        <p className="flex items-center gap-2 text-gray-300 text-sm mb-2">
          <PackageIcon className="w-4 h-4 text-[#d4af37]" />
          الباقة
        </p>
        {packages.length === 0 ? (
          <p className="text-gray-600 text-xs">لا توجد باقات مفعّلة — أضفها من صفحة «الباقات»</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {packages.map(pkg => {
              const on = pkg.id === selectedPackageId
              return (
                <button
                  key={pkg.id}
                  onClick={() => selectPackage(pkg)}
                  className={`relative text-right p-4 rounded-xl border transition-all ${
                    on
                      ? 'bg-[#d4af37]/10 border-[#d4af37]/40'
                      : 'bg-[#0f0f16] border-white/10 hover:border-white/20'
                  }`}
                >
                  {on && <Check className="absolute left-3 top-3 w-4 h-4 text-[#d4af37]" />}
                  <p className={`font-bold text-sm ${on ? 'text-[#d4af37]' : 'text-white'}`}>{pkg.name}</p>
                  {pkg.suitable_for && (
                    <p className="text-gray-500 text-xs mt-1">مناسبة لـ: {pkg.suitable_for}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-2">
                    {formatRange(pkg.price, pkg.price_max)} ر.س
                    {pkg.delivery ? <span className="text-gray-600"> — {pkg.delivery}</span> : null}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Add-ons */}
      <div>
        <p className="flex items-center gap-2 text-gray-300 text-sm mb-2">
          <Sparkles className="w-4 h-4 text-[#d4af37]" />
          الخدمات الإضافية
        </p>
        {addons.length === 0 ? (
          <p className="text-gray-600 text-xs">لا توجد إضافات مفعّلة — أضفها من صفحة «الإضافات»</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {addons.map(a => {
              const on = selectedAddonIds.has(a.id)
              return (
                <button
                  key={a.id}
                  onClick={() => toggleAddon(a)}
                  className={`px-3.5 py-2 rounded-xl text-sm border transition-all ${
                    on
                      ? 'bg-[#d4af37]/10 border-[#d4af37]/40 text-[#d4af37]'
                      : 'bg-[#0f0f16] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {a.name}
                  <span className="text-xs opacity-60 mr-2" dir="ltr">{addonPriceHint(a)}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected rows */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-300 text-sm">البنود ({items.length})</p>
          <button
            onClick={() => onChange([...items, customItem()])}
            title="لخدمة غير موجودة في الباقات أو الإضافات"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            بند يدوي
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8 bg-[#0f0f16] rounded-xl border border-white/5">
            اختر باقة وإضافات من الأعلى
          </p>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const isPercent = item.pricing === 'percent'
              const outOfRange =
                item.priceMin != null &&
                (item.price < item.priceMin || (item.priceMax != null && item.price > item.priceMax))
              const badge = KIND_BADGE[item.kind]

              return (
                <div key={item.id} className="bg-[#0f0f16] rounded-xl border border-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] flex-shrink-0 ${badge.className}`}>
                          {badge.label}
                        </span>
                        <input
                          value={item.name}
                          onChange={e => edit(item.id, { name: e.target.value })}
                          placeholder="اسم الخدمة"
                          className="flex-1 min-w-0 bg-transparent text-white font-bold text-sm focus:outline-none placeholder-gray-600"
                        />
                      </div>
                      <textarea
                        value={item.spec}
                        onChange={e => edit(item.id, { spec: e.target.value })}
                        rows={item.kind === 'package' ? 2 : 1}
                        placeholder="المواصفات — تظهر للعميل"
                        className="w-full bg-transparent text-gray-500 text-xs leading-relaxed resize-y focus:outline-none placeholder-gray-700"
                      />
                    </div>
                    <button
                      onClick={() => onChange(items.filter(i => i.id !== item.id))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                      title="حذف البند"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-white/5">
                    <label className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">مدة التسليم</span>
                      <input
                        value={item.delivery}
                        onChange={e => edit(item.id, { delivery: e.target.value })}
                        placeholder="5 أيام عمل"
                        className={`${smallInput} w-28`}
                      />
                    </label>

                    {!isPercent && item.kind !== 'package' && (
                      <label className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">
                          {item.unitLabel ? `العدد (${item.unitLabel})` : 'العدد'}
                        </span>
                        <input
                          type="number" min={0} value={item.qty}
                          onChange={e => edit(item.id, { qty: Number(e.target.value) })}
                          className={`${smallInput} w-20`}
                        />
                      </label>
                    )}

                    <label className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">
                        {isPercent ? 'النسبة %' : item.unitLabel ? `سعر الـ${item.unitLabel}` : 'السعر'}
                      </span>
                      <input
                        type="number" min={0} value={item.price}
                        onChange={e => edit(item.id, { price: Number(e.target.value) })}
                        className={`${smallInput} w-28 ${outOfRange ? 'border-amber-500/40' : ''}`}
                      />
                    </label>

                    <span className="mr-auto text-[#d4af37] font-bold text-sm">
                      {formatSAR(lineAmount(item, base))} ر.س
                    </span>
                  </div>

                  {item.priceMin != null && (item.priceMin > 0 || item.priceMax != null) && (
                    <p className={`flex items-center gap-1.5 text-xs mt-2 ${outOfRange ? 'text-amber-400/90' : 'text-gray-600'}`}>
                      {outOfRange && <AlertTriangle className="w-3.5 h-3.5" />}
                      النطاق المقترح: {formatRange(item.priceMin, item.priceMax, isPercent ? '%' : '')}
                      {isPercent ? ` — ${formatSAR(lineAmount(item, base))} ر.س من ${formatSAR(base)}` : ''}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
