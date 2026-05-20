import { useState, useEffect } from 'react'
import { Save, Plus, X, CheckCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

type Tab = 'hero' | 'about' | 'why_us' | 'process' | 'contact'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'hero',    label: 'الهيرو',       emoji: '🏠' },
  { id: 'about',   label: 'عن المصور',   emoji: '👤' },
  { id: 'why_us',  label: 'لماذا نحن',   emoji: '⭐' },
  { id: 'process', label: 'كيف نعمل',    emoji: '📋' },
  { id: 'contact', label: 'التواصل',      emoji: '💬' },
]

// Shape of content loaded from DB
type BlocksMap = Record<string, string>          // section+key → value
type ListMap   = Record<string, string[]>        // section → string[]

// ─── Reusable sub-components ────────────────────────────────────────────────

function TextBlock({
  label,
  value,
  onChange,
  multiline = false,
  placeholder = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  placeholder?: string
}) {
  return (
    <div className="mb-5">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-[#0f0f16] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37]/50 transition-colors resize-none leading-relaxed"
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0f0f16] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37]/50 transition-colors"
        />
      )}
    </div>
  )
}

function ListEditor({
  label,
  items,
  onChange,
  placeholder = 'أضف عنصراً...',
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}) {
  const [newItem, setNewItem] = useState('')

  function add() {
    if (!newItem.trim()) return
    onChange([...items, newItem.trim()])
    setNewItem('')
  }

  function update(index: number, value: string) {
    const updated = [...items]
    updated[index] = value
    onChange(updated)
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="mb-5">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{label}</label>
      <div className="space-y-2 mb-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 group">
            <div className="w-6 h-6 flex-shrink-0 bg-[#d4af37]/10 text-[#d4af37] rounded-full flex items-center justify-center text-xs font-bold">
              {idx + 1}
            </div>
            <input
              value={item}
              onChange={e => update(idx, e.target.value)}
              className="flex-1 bg-[#0f0f16] border border-white/10 rounded-xl px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-[#d4af37]/40 transition-colors"
            />
            <button
              onClick={() => remove(idx)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={placeholder}
          className="flex-1 bg-[#0f0f16] border border-dashed border-white/10 rounded-xl px-3 py-2 text-gray-400 text-sm placeholder-gray-600 focus:outline-none focus:border-[#d4af37]/30 transition-colors"
        />
        <button
          onClick={add}
          disabled={!newItem.trim()}
          className="w-9 h-9 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] rounded-xl flex items-center justify-center transition-colors disabled:opacity-30"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Save button ─────────────────────────────────────────────────────────────
function SaveBar({ dirty, saving, saved, onSave }: { dirty: boolean; saving: boolean; saved: boolean; onSave: () => void }) {
  return (
    <div className="mt-8 flex justify-end">
      <button
        onClick={onSave}
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
          <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : saved ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ!' : 'حفظ التغييرات'}
      </button>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Content() {
  const [activeTab, setActiveTab] = useState<Tab>('hero')
  const [blocks, setBlocks] = useState<BlocksMap>({})
  const [lists, setLists] = useState<ListMap>({})
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchContent()
  }, [])

  async function fetchContent() {
    setLoading(true)
    const { data } = await supabase.from('content_blocks').select('section, key, value')
    const blockMap: BlocksMap = {}
    const listMap: ListMap = {}

    if (data) {
      data.forEach(row => {
        const k = `${row.section}__${row.key}`
        if (row.key === 'items' || row.key === 'steps') {
          try { listMap[row.section] = JSON.parse(row.value) } catch { listMap[row.section] = [] }
        } else {
          blockMap[k] = row.value
        }
      })
    }

    // Default lists if not in DB yet
    if (!listMap['why_us']) listMap['why_us'] = [
      'خبرة في إبراز جمال المساحات المعمارية',
      'فهم عميق لزوايا التصوير العقاري',
      'سرعة في التسليم',
      'جودة احترافية عالية',
      'تصوير يساعد على البيع والتسويق',
      'اهتمام بالتفاصيل الصغيرة',
    ]
    if (!listMap['process']) listMap['process'] = [
      'تواصل معنا وحدد احتياجك',
      'معاينة العقار أو معرفة التفاصيل',
      'تحديد موعد التصوير',
      'تنفيذ الجلسة باحترافية',
      'تسليم الصور والفيديو خلال الوقت المتفق',
    ]

    setBlocks(blockMap)
    setLists(listMap)
    setLoading(false)
  }

  function setBlock(section: string, key: string, value: string) {
    setBlocks(prev => ({ ...prev, [`${section}__${key}`]: value }))
    setDirty(true)
    setSaved(false)
  }

  function setList(section: string, items: string[]) {
    setLists(prev => ({ ...prev, [section]: items }))
    setDirty(true)
    setSaved(false)
  }

  function b(section: string, key: string) {
    return blocks[`${section}__${key}`] ?? ''
  }

  async function save() {
    setSaving(true)

    // Build upsert rows for text blocks
    const textRows = Object.entries(blocks).map(([k, value]) => {
      const [section, key] = k.split('__')
      return { section, key, value, updated_at: new Date().toISOString() }
    })

    // Build upsert rows for lists
    const listRows = Object.entries(lists).map(([section, items]) => ({
      section,
      key: section === 'process' ? 'steps' : 'items',
      value: JSON.stringify(items),
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('content_blocks')
      .upsert([...textRows, ...listRows], { onConflict: 'section,key' })

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
        <div className="h-8 w-48 bg-[#1a1a24] rounded-xl animate-pulse mb-8" />
        <div className="flex gap-2 mb-8">
          {[1,2,3,4,5].map(i => <div key={i} className="h-10 w-24 bg-[#1a1a24] rounded-xl animate-pulse" />)}
        </div>
        <div className="space-y-4 max-w-2xl">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-[#1a1a24] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">إدارة المحتوى</h1>
        <p className="text-gray-400 mt-1">عدّل نصوص الموقع مباشرة — التغييرات تظهر فوراً</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30'
                : 'bg-[#1a1a24] text-gray-400 hover:text-white border border-white/5 hover:border-white/15'
            }`}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="bg-[#1a1a24] rounded-2xl border border-white/5 p-7 max-w-2xl">

        {/* ── Hero ── */}
        {activeTab === 'hero' && (
          <div>
            <p className="text-white font-bold mb-6">نصوص قسم الهيرو (الصفحة الرئيسية)</p>
            <TextBlock label="العنوان الرئيسي" value={b('hero','headline')} onChange={v => setBlock('hero','headline',v)} multiline placeholder="نحوّل العقار إلى تجربة بصرية تبيع قبل الزيارة" />
            <TextBlock label="العنوان الفرعي" value={b('hero','subtitle')} onChange={v => setBlock('hero','subtitle',v)} multiline placeholder="تصوير احترافي للعقارات..." />
            <TextBlock label="السطر التسويقي (الذهبي)" value={b('hero','tagline')} onChange={v => setBlock('hero','tagline',v)} multiline placeholder="بإخراج بصري يعكس الفخامة..." />
          </div>
        )}

        {/* ── About ── */}
        {activeTab === 'about' && (
          <div>
            <p className="text-white font-bold mb-6">نصوص قسم "عن المصور"</p>
            <TextBlock label="الفقرة الأولى" value={b('about','paragraph_1')} onChange={v => setBlock('about','paragraph_1',v)} multiline placeholder="أنا مصور عقاري متخصص..." />
            <TextBlock label="الفقرة الثانية" value={b('about','paragraph_2')} onChange={v => setBlock('about','paragraph_2',v)} multiline placeholder="أجمع بين الحس البصري..." />
          </div>
        )}

        {/* ── Why Us ── */}
        {activeTab === 'why_us' && (
          <div>
            <p className="text-white font-bold mb-6">أسباب اختيار عملاؤنا لنا</p>
            <ListEditor
              label="قائمة المميزات"
              items={lists['why_us'] ?? []}
              onChange={items => setList('why_us', items)}
              placeholder="أضف ميزة جديدة..."
            />
          </div>
        )}

        {/* ── Process ── */}
        {activeTab === 'process' && (
          <div>
            <p className="text-white font-bold mb-6">خطوات العمل "كيف نعمل؟"</p>
            <ListEditor
              label="الخطوات بالترتيب"
              items={lists['process'] ?? []}
              onChange={items => setList('process', items)}
              placeholder="أضف خطوة جديدة..."
            />
          </div>
        )}

        {/* ── Contact ── */}
        {activeTab === 'contact' && (
          <div>
            <p className="text-white font-bold mb-6">نصوص قسم التواصل</p>
            <TextBlock label="العنوان" value={b('contact','headline')} onChange={v => setBlock('contact','headline',v)} placeholder="جاهز لإظهار عقارك بأفضل صورة؟" />
            <TextBlock label="النص التوضيحي" value={b('contact','subtitle')} onChange={v => setBlock('contact','subtitle',v)} multiline placeholder="تواصل معنا الآن..." />
          </div>
        )}

        <SaveBar dirty={dirty} saving={saving} saved={saved} onSave={save} />
      </div>
    </div>
  )
}
