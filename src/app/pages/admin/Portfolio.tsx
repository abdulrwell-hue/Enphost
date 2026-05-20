import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, Eye, EyeOff, Images } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { PortfolioItem } from '../../../lib/types'

export default function Portfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('portfolio_items')
      .select('*')
      .order('sort_order')
    if (data) setItems(data)
    setLoading(false)
  }

  async function uploadFiles(files: FileList) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    setUploading(true)

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      setUploadProgress(`${i + 1} / ${imageFiles.length}`)

      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        console.error('Upload failed:', uploadError.message)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('portfolio')
        .getPublicUrl(path)

      await supabase.from('portfolio_items').insert({
        storage_path: path,
        public_url: urlData.publicUrl,
        sort_order: items.length + i,
        is_visible: true,
      })
    }

    setUploading(false)
    setUploadProgress('')
    await fetchItems()
  }

  async function toggleVisibility(item: PortfolioItem) {
    const next = !item.is_visible
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_visible: next } : i))
    await supabase.from('portfolio_items').update({ is_visible: next }).eq('id', item.id)
  }

  async function deleteItem(item: PortfolioItem) {
    if (!window.confirm('هل تريد حذف هذه الصورة نهائياً؟')) return

    // Remove from storage
    await supabase.storage.from('portfolio').remove([item.storage_path])
    // Remove from DB
    await supabase.from('portfolio_items').delete().eq('id', item.id)
    setItems(prev => prev.filter(i => i.id !== item.id))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files)
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة البورتفوليو</h1>
          <p className="text-gray-400 mt-1">
            {loading ? '...' : `${items.length} صورة · ${items.filter(i => i.is_visible).length} ظاهرة`}
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          رفع صور
        </button>
      </div>

      {/* Upload Dropzone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center mb-8 transition-all cursor-pointer ${
          dragOver
            ? 'border-[#d4af37] bg-[#d4af37]/10'
            : 'border-[#d4af37]/20 hover:border-[#d4af37]/50 bg-[#1a1a24]'
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#d4af37] font-semibold">جاري رفع الصور... {uploadProgress}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div className="w-16 h-16 bg-[#d4af37]/10 rounded-2xl flex items-center justify-center">
              <Upload className="w-8 h-8 text-[#d4af37]" />
            </div>
            <p className="text-white font-semibold text-lg">اسحب الصور هنا أو انقر للاختيار</p>
            <p className="text-gray-500 text-sm">JPG · PNG · WEBP — يمكن رفع أكثر من صورة في وقت واحد</p>
          </div>
        )}
      </div>

      {/* Photo Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-[#1a1a24] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 text-gray-500 bg-[#1a1a24] rounded-2xl border border-white/5">
          <Images className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">لا توجد صور بعد</p>
          <p className="text-sm mt-1">ارفع أول صورة من المنطقة أعلاه</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <div
              key={item.id}
              className="relative group rounded-xl overflow-hidden aspect-[4/3] bg-[#1a1a24] border border-white/5"
            >
              <img
                src={item.public_url}
                alt={item.title || 'صورة عقارية'}
                className={`w-full h-full object-cover transition-all duration-300 ${!item.is_visible ? 'opacity-40 grayscale' : ''}`}
              />

              {/* Hidden badge */}
              {!item.is_visible && (
                <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-1 flex items-center gap-1">
                  <EyeOff className="w-3 h-3 text-gray-300" />
                  <span className="text-gray-300 text-xs">مخفية</span>
                </div>
              )}

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                <button
                  onClick={() => toggleVisibility(item)}
                  title={item.is_visible ? 'إخفاء من الموقع' : 'إظهار في الموقع'}
                  className="w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors"
                >
                  {item.is_visible
                    ? <Eye className="w-5 h-5 text-white" />
                    : <EyeOff className="w-5 h-5 text-white" />
                  }
                </button>
                <button
                  onClick={() => deleteItem(item)}
                  title="حذف الصورة"
                  className="w-11 h-11 bg-red-500/20 hover:bg-red-500/50 rounded-full flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
