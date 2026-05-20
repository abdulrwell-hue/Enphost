import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, Eye, EyeOff, Video as VideoIcon, Pencil, Check, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Video } from '../../../lib/types'

export default function Videos() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  async function fetchVideos() {
    setLoading(true)
    const { data } = await supabase
      .from('videos')
      .select('*')
      .order('sort_order')
    if (data) setVideos(data)
    setLoading(false)
  }

  async function uploadVideo(file: File) {
    if (!file.type.startsWith('video/')) return
    setUploading(true)

    const ext = file.name.split('.').pop() ?? 'mp4'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      console.error('Upload failed:', uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(path)

    await supabase.from('videos').insert({
      storage_path: path,
      public_url: urlData.publicUrl,
      title: file.name.replace(/\.[^.]+$/, '') || 'فيديو سينمائي',
      is_visible: true,
      sort_order: videos.length,
    })

    setUploading(false)
    await fetchVideos()
  }

  async function toggleVisibility(video: Video) {
    const next = !video.is_visible
    setVideos(prev => prev.map(v => v.id === video.id ? { ...v, is_visible: next } : v))
    await supabase.from('videos').update({ is_visible: next }).eq('id', video.id)
  }

  async function deleteVideo(video: Video) {
    if (!window.confirm('هل تريد حذف هذا الفيديو نهائياً؟')) return
    await supabase.storage.from('videos').remove([video.storage_path])
    await supabase.from('videos').delete().eq('id', video.id)
    setVideos(prev => prev.filter(v => v.id !== video.id))
  }

  function startEdit(video: Video) {
    setEditingId(video.id)
    setEditTitle(video.title)
  }

  async function saveTitle(video: Video) {
    if (!editTitle.trim()) return
    await supabase.from('videos').update({ title: editTitle.trim() }).eq('id', video.id)
    setVideos(prev => prev.map(v => v.id === video.id ? { ...v, title: editTitle.trim() } : v))
    setEditingId(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadVideo(file)
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة الفيديوهات</h1>
          <p className="text-gray-400 mt-1">
            {loading ? '...' : `${videos.length} فيديو`}
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          رفع فيديو
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
          accept="video/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && uploadVideo(e.target.files[0])}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#d4af37] font-semibold">جاري رفع الفيديو...</p>
            <p className="text-gray-500 text-sm">قد يستغرق هذا بعض الوقت حسب حجم الملف</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div className="w-16 h-16 bg-[#d4af37]/10 rounded-2xl flex items-center justify-center">
              <VideoIcon className="w-8 h-8 text-[#d4af37]" />
            </div>
            <p className="text-white font-semibold text-lg">اسحب الفيديو هنا أو انقر للاختيار</p>
            <p className="text-gray-500 text-sm">MP4 · MOV · AVI — فيديو واحد في كل مرة</p>
          </div>
        )}
      </div>

      {/* Videos List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-[#1a1a24] rounded-2xl h-56 animate-pulse" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-24 text-gray-500 bg-[#1a1a24] rounded-2xl border border-white/5">
          <VideoIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">لا توجد فيديوهات بعد</p>
          <p className="text-sm mt-1">ارفع أول فيديو من المنطقة أعلاه</p>
        </div>
      ) : (
        <div className="space-y-6">
          {videos.map(video => (
            <div
              key={video.id}
              className={`bg-[#1a1a24] rounded-2xl border overflow-hidden transition-all ${
                video.is_visible ? 'border-white/5' : 'border-white/5 opacity-60'
              }`}
            >
              {/* Video Player */}
              <div className="relative">
                <video
                  controls
                  className="w-full max-h-72 object-cover bg-black"
                  src={video.public_url}
                />
                {!video.is_visible && (
                  <div className="absolute top-3 right-3 bg-black/70 rounded-full px-3 py-1 flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 text-gray-300" />
                    <span className="text-gray-300 text-xs font-medium">مخفي من الموقع</span>
                  </div>
                )}
              </div>

              {/* Video Info & Actions */}
              <div className="p-5 flex items-center justify-between gap-4">
                {/* Title */}
                <div className="flex-1 min-w-0">
                  {editingId === video.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveTitle(video)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="flex-1 bg-[#0f0f16] border border-[#d4af37]/40 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#d4af37]"
                      />
                      <button onClick={() => saveTitle(video)} className="text-green-400 hover:text-green-300 transition-colors">
                        <Check className="w-5 h-5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group/title">
                      <p className="text-white font-semibold truncate">{video.title}</p>
                      <button
                        onClick={() => startEdit(video)}
                        className="opacity-0 group-hover/title:opacity-100 transition-opacity text-gray-500 hover:text-[#d4af37]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleVisibility(video)}
                    title={video.is_visible ? 'إخفاء من الموقع' : 'إظهار في الموقع'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      video.is_visible
                        ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                        : 'bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37]/20'
                    }`}
                  >
                    {video.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {video.is_visible ? 'ظاهر' : 'مخفي'}
                  </button>
                  <button
                    onClick={() => deleteVideo(video)}
                    title="حذف الفيديو"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
