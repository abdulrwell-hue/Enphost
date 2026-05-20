import { useState, useEffect } from 'react'
import { Save, Phone, Instagram, Mail, Camera, CheckCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface SettingField {
  key: string
  label: string
  placeholder: string
  icon: React.ElementType
  type?: string
  hint?: string
  prefix?: string
  dir?: 'ltr' | 'rtl'
}

const FIELDS: SettingField[] = [
  {
    key: 'business_name',
    label: 'اسم النشاط التجاري',
    placeholder: 'Enphost',
    icon: Camera,
    hint: 'يظهر في الشعار وعنوان المتصفح',
    dir: 'rtl',
  },
  {
    key: 'whatsapp_number',
    label: 'رقم واتساب',
    placeholder: '966599991078',
    icon: Phone,
    hint: 'بدون + أو أصفار في البداية — مثال: 966599991078',
    dir: 'ltr',
  },
  {
    key: 'instagram_handle',
    label: 'حساب إنستغرام',
    placeholder: 'Enpho_st',
    icon: Instagram,
    prefix: '@',
    hint: 'بدون @ — مثال: Enpho_st',
    dir: 'ltr',
  },
  {
    key: 'email',
    label: 'البريد الإلكتروني',
    placeholder: 'info@photographer.com',
    icon: Mail,
    type: 'email',
    hint: 'يظهر في تذييل الصفحة',
    dir: 'ltr',
  },
]

export default function Settings() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    const { data } = await supabase.from('site_settings').select('key, value')
    if (data) {
      const map: Record<string, string> = {}
      data.forEach(s => { map[s.key] = s.value })
      setValues(map)
    }
    setLoading(false)
  }

  function handleChange(key: string, value: string) {
    setValues(prev => ({ ...prev, [key]: value }))
    setDirty(true)
    setSaved(false)
  }

  async function saveAll() {
    setSaving(true)
    const upserts = FIELDS.map(f => ({
      key: f.key,
      value: values[f.key] ?? '',
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('site_settings')
      .upsert(upserts, { onConflict: 'key' })

    setSaving(false)
    if (!error) {
      setSaved(true)
      setDirty(false)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (loading) {
    return (
      <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
        <div className="h-8 w-40 bg-[#1a1a24] rounded-xl animate-pulse mb-8" />
        <div className="max-w-xl space-y-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-[#1a1a24] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">إعدادات الموقع</h1>
          <p className="text-gray-400 mt-1">معلومات التواصل والعلامة التجارية</p>
        </div>
        <button
          onClick={saveAll}
          disabled={!dirty || saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
            saved
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : dirty
              ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] hover:opacity-90'
              : 'bg-white/5 text-gray-500 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ!' : 'حفظ التغييرات'}
        </button>
      </div>

      {/* Form */}
      <div className="max-w-xl space-y-5">
        {FIELDS.map(field => (
          <div
            key={field.key}
            className="bg-[#1a1a24] rounded-2xl p-5 border border-white/5 hover:border-[#d4af37]/20 transition-colors"
          >
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
              <field.icon className="w-4 h-4 text-[#d4af37]" />
              {field.label}
            </label>

            <div className="relative">
              {field.prefix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium select-none">
                  {field.prefix}
                </span>
              )}
              <input
                type={field.type ?? 'text'}
                value={values[field.key] ?? ''}
                onChange={e => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                dir={field.dir ?? 'ltr'}
                className={`w-full bg-[#0f0f16] border border-white/10 rounded-xl py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37]/50 transition-colors ${
                  field.prefix ? 'pr-7 pl-4' : 'px-4'
                }`}
              />
            </div>

            {field.hint && (
              <p className="text-gray-600 text-xs mt-2">{field.hint}</p>
            )}
          </div>
        ))}

        {/* Preview card */}
        <div className="bg-[#0f0f16] rounded-2xl p-5 border border-[#d4af37]/10">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">معاينة روابط التواصل</p>
          <div className="space-y-2">
            {values.whatsapp_number && (
              <a
                href={`https://wa.me/${values.whatsapp_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 transition-colors"
              >
                <Phone className="w-4 h-4 text-[#25D366]" />
                <span dir="ltr">wa.me/{values.whatsapp_number}</span>
              </a>
            )}
            {values.instagram_handle && (
              <a
                href={`https://www.instagram.com/${values.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-pink-400 transition-colors"
              >
                <Instagram className="w-4 h-4 text-pink-400" />
                <span dir="ltr">instagram.com/{values.instagram_handle}</span>
              </a>
            )}
            {values.email && (
              <a
                href={`mailto:${values.email}`}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Mail className="w-4 h-4 text-blue-400" />
                <span dir="ltr">{values.email}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
