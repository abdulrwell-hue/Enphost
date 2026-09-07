import { useState } from 'react'
import { Save, RotateCcw, X, CheckCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { DEFAULT_PRICING, TIERS, type PricingConfig } from '../../../lib/pricing'

export const PRICING_SETTINGS_KEY = 'quotation_pricing'

interface Props {
  config: PricingConfig
  onClose: () => void
  onSaved: (config: PricingConfig) => void
}

function NumField({
  label, hint, value, onChange, suffix,
}: {
  label: string
  hint?: string
  value: number
  onChange: (n: number) => void
  suffix?: string
}) {
  return (
    <label className="block">
      <span className="block text-gray-300 text-sm mb-1.5">{label}</span>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full bg-[#0f0f16] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 transition-colors"
        />
        {suffix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <span className="block text-gray-600 text-xs mt-1">{hint}</span>}
    </label>
  )
}

/** لوحة ضبط معادلة التسعير — تُحفظ في site_settings */
export default function QuotationPricingSettings({ config, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<PricingConfig>(config)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof PricingConfig>(key: K, value: PricingConfig[K]) =>
    setDraft(prev => ({ ...prev, [key]: value }))

  async function save() {
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        {
          key: PRICING_SETTINGS_KEY,
          value: JSON.stringify(draft),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      )

    setSaving(false)
    if (error) { setError(error.message); return }
    setSaved(true)
    onSaved(draft)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 lg:p-8">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        dir="rtl"
        style={{ fontFamily: "'Cairo', sans-serif" }}
        className="relative w-full max-w-3xl bg-[#1a1a24] border border-white/10 rounded-2xl p-6 my-4"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">إعدادات التسعير</h2>
            <p className="text-gray-400 text-sm mt-1">
              الأرقام التي تبني عليها الحاسبة السعر المقترح — عدّلها لتناسب سوقك
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Tier rates */}
        <p className="text-[#d4af37] text-sm font-bold mb-3">سعر الوحدة حسب مستوى التسليم</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {TIERS.map(t => (
            <NumField
              key={t.key}
              label={t.label}
              hint={t.deliverable}
              suffix="ريال"
              value={draft.tierRates[t.key]}
              onChange={n => set('tierRates', { ...draft.tierRates, [t.key]: n })}
            />
          ))}
        </div>

        {/* Project-level fees */}
        <p className="text-[#d4af37] text-sm font-bold mb-3">رسوم على مستوى المشروع</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <NumField
            label="التجهيز والانتقال (يوم واحد)"
            hint="يُحتسب مرة واحدة مهما كان عدد الوحدات"
            suffix="ريال"
            value={draft.mobilizationBase}
            onChange={n => set('mobilizationBase', n)}
          />
          <NumField
            label="كل يوم تصوير إضافي"
            suffix="ريال"
            value={draft.extraDayRate}
            onChange={n => set('extraDayRate', n)}
          />
          <NumField
            label="تصوير المرافق والواجهات"
            hint="يُضاف عند تشابه الوحدات فقط"
            suffix="ريال"
            value={draft.commonAreasFee}
            onChange={n => set('commonAreasFee', n)}
          />
          <NumField
            label="أقل سعر تجاري معقول للوحدة"
            hint="تحت هذا الرقم يظهر تنبيه في الحاسبة"
            suffix="ريال"
            value={draft.minCommercialUnitRate}
            onChange={n => set('minCommercialUnitRate', n)}
          />
        </div>

        {/* Productivity + similarity */}
        <p className="text-[#d4af37] text-sm font-bold mb-3">الإنتاجية والتشابه</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {TIERS.map(t => (
            <NumField
              key={t.key}
              label={`وحدات/يوم — ${t.label}`}
              value={draft.unitsPerDay[t.key]}
              onChange={n => set('unitsPerDay', { ...draft.unitsPerDay, [t.key]: n })}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <NumField
            label="نسبة الوحدات النموذجية"
            hint="0.3 = يُصوَّر 30% من الوحدات المتشابهة"
            value={draft.similarSampleRatio}
            onChange={n => set('similarSampleRatio', n)}
          />
          <NumField
            label="أقل عدد نماذج"
            value={draft.similarSampleMin}
            onChange={n => set('similarSampleMin', n)}
          />
          <NumField
            label="أكثر عدد نماذج"
            value={draft.similarSampleMax}
            onChange={n => set('similarSampleMax', n)}
          />
        </div>

        {/* Volume tiers */}
        <p className="text-[#d4af37] text-sm font-bold mb-1">معامل الحجم</p>
        <p className="text-gray-600 text-xs mb-3">
          كلما زاد عدد الوحدات انخفض سعر الوحدة — الوحدة المفردة أغلى لأن التجهيز لا يتوزّع
        </p>
        <div className="space-y-2 mb-6">
          {draft.volumeTiers.map((tier, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-gray-400 text-sm w-24 flex-shrink-0">من {tier.min} وحدة</span>
              <input
                type="number"
                step="0.05"
                value={tier.factor}
                onChange={e => {
                  const factor = Number(e.target.value)
                  set('volumeTiers', draft.volumeTiers.map((t, j) => j === i ? { ...t, factor } : t))
                }}
                className="w-28 bg-[#0f0f16] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#d4af37]/40"
              />
              <span className="text-gray-600 text-xs">
                ≈ {Math.round(draft.tierRates.standard * tier.factor)} ريال للوحدة (تصوير احترافي)
              </span>
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <p className="text-[#d4af37] text-sm font-bold mb-3">أسعار الإضافات</p>
        <div className="space-y-2 mb-6">
          {draft.addOns.map((addon, i) => (
            <div key={addon.key} className="flex items-center gap-3">
              <span className="text-gray-300 text-sm flex-1">{addon.label}</span>
              <span className="text-gray-600 text-xs w-24 flex-shrink-0">
                {addon.type === 'per_unit' ? 'لكل وحدة' : addon.type === 'percent' ? 'نسبة %' : 'ثابت'}
              </span>
              <input
                type="number"
                value={addon.amount}
                onChange={e => {
                  const amount = Number(e.target.value)
                  set('addOns', draft.addOns.map((a, j) => j === i ? { ...a, amount } : a))
                }}
                className="w-28 bg-[#0f0f16] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#d4af37]/40"
              />
            </div>
          ))}
        </div>

        {/* Range + VAT */}
        <p className="text-[#d4af37] text-sm font-bold mb-3">النطاق المقترح والضريبة</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <NumField
            label="حد النطاق الأدنى"
            hint="0.95 = أقل بـ 5% من السعر الأساسي"
            value={draft.rangeLow}
            onChange={n => set('rangeLow', n)}
          />
          <NumField
            label="حد النطاق الأعلى"
            hint="1.25 = أعلى بـ 25%"
            value={draft.rangeHigh}
            onChange={n => set('rangeHigh', n)}
          />
          <NumField
            label="نسبة الضريبة"
            suffix="%"
            value={draft.vatPct}
            onChange={n => set('vatPct', n)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              saved
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] hover:opacity-90'
            }`}
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-[#0a0a0f]/30 border-t-[#0a0a0f] rounded-full animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ' : 'حفظ الإعدادات'}
          </button>

          <button
            onClick={() => setDraft(DEFAULT_PRICING)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            استعادة الافتراضي
          </button>
        </div>
      </div>
    </div>
  )
}
