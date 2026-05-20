import { useEffect, useState } from 'react'
import { Images, Video, Package, Settings, MessageCircle, Instagram, ArrowUpRight } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface Stats {
  portfolio: number
  videos: number
  packages: number
}

export default function Overview() {
  const [stats, setStats] = useState<Stats>({ portfolio: 0, videos: 0, packages: 0 })
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [portfolioRes, videosRes, packagesRes, settingsRes] = await Promise.all([
        supabase.from('portfolio_items').select('id', { count: 'exact', head: true }),
        supabase.from('videos').select('id', { count: 'exact', head: true }),
        supabase.from('packages').select('id', { count: 'exact', head: true }),
        supabase.from('site_settings').select('key, value'),
      ])

      setStats({
        portfolio: portfolioRes.count ?? 0,
        videos: videosRes.count ?? 0,
        packages: packagesRes.count ?? 0,
      })

      const map: Record<string, string> = {}
      settingsRes.data?.forEach(s => { map[s.key] = s.value })
      setSettings(map)
      setLoading(false)
    }
    fetchData()
  }, [])

  const statCards = [
    { label: 'صور البورتفوليو', value: stats.portfolio, icon: Images, color: '#d4af37', href: '/admin/portfolio' },
    { label: 'الفيديوهات', value: stats.videos, icon: Video, color: '#60a5fa', href: '/admin/videos' },
    { label: 'الباقات', value: stats.packages, icon: Package, color: '#4ade80', href: '/admin/packages' },
  ]

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">مرحباً 👋</h1>
        <p className="text-gray-400 mt-1">هذه لوحة التحكم الخاصة بموقع Enphost</p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#1a1a24] rounded-2xl p-6 border border-white/5 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {statCards.map(card => (
            <a
              key={card.label}
              href={card.href}
              className="bg-[#1a1a24] rounded-2xl p-6 border border-white/5 hover:border-[#d4af37]/30 transition-all duration-200 group block"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{card.label}</p>
                  <p className="text-4xl font-bold text-white">{card.value}</p>
                </div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity"
                  style={{ background: `${card.color}20` }}
                >
                  <card.icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 text-xs text-gray-500 group-hover:text-[#d4af37] transition-colors">
                <span>إدارة</span>
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Site Links */}
        <div className="bg-[#1a1a24] rounded-2xl p-6 border border-white/5">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#d4af37]" />
            روابط سريعة
          </h2>
          <div className="space-y-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-[#0f0f16] rounded-xl hover:border-[#d4af37]/30 border border-transparent transition-all group"
            >
              <span className="text-gray-300 text-sm">عرض الموقع</span>
              <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-[#d4af37] transition-colors" />
            </a>
            {settings.whatsapp_number && (
              <a
                href={`https://wa.me/${settings.whatsapp_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-[#0f0f16] rounded-xl hover:border-green-500/30 border border-transparent transition-all group"
              >
                <span className="text-gray-300 text-sm flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  واتساب
                </span>
                <span className="text-gray-500 text-xs" dir="ltr">+{settings.whatsapp_number}</span>
              </a>
            )}
            {settings.instagram_handle && (
              <a
                href={`https://www.instagram.com/${settings.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-[#0f0f16] rounded-xl hover:border-pink-500/30 border border-transparent transition-all group"
              >
                <span className="text-gray-300 text-sm flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-400" />
                  إنستغرام
                </span>
                <span className="text-gray-500 text-xs">@{settings.instagram_handle}</span>
              </a>
            )}
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-[#1a1a24] rounded-2xl p-6 border border-white/5">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <span className="text-[#d4af37]">🚀</span>
            ابدأ من هنا
          </h2>
          <div className="space-y-3">
            {[
              { step: '1', text: 'ارفع صور البورتفوليو من قسم الصور', href: '/admin/portfolio', done: stats.portfolio > 0 },
              { step: '2', text: 'ارفع الفيديو السينمائي', href: '/admin/videos', done: stats.videos > 0 },
              { step: '3', text: 'راجع وعدّل الباقات والأسعار', href: '/admin/packages', done: true },
              { step: '4', text: 'حدّث معلومات التواصل', href: '/admin/settings', done: !!settings.email },
            ].map(item => (
              <a
                key={item.step}
                href={item.href}
                className="flex items-center gap-3 p-3 bg-[#0f0f16] rounded-xl hover:border-[#d4af37]/30 border border-transparent transition-all group"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${item.done ? 'bg-green-500/20 text-green-400' : 'bg-[#d4af37]/20 text-[#d4af37]'}`}>
                  {item.done ? '✓' : item.step}
                </div>
                <span className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-300 group-hover:text-white transition-colors'}`}>
                  {item.text}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
