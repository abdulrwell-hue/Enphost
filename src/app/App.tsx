import { useEffect, useState } from 'react'
import { Camera, Video, Instagram, MessageCircle, ChevronDown, ScrollText } from 'lucide-react'
import { motion } from 'motion/react'
import { supabase } from '../lib/supabase'
import type { Package, PortfolioItem, Video as VideoType, SettingsMap, TermsCondition } from '../lib/types'

// ── Default / fallback values while loading ─────────────────────────────────
const DEFAULT_WHATSAPP = '966599991078'
const DEFAULT_INSTAGRAM = 'Enpho_st'

const STATIC_SERVICES = [
  {
    icon: Camera,
    title: 'تصوير عقاري احترافي',
    description: 'صور داخلية وخارجية عالية الجودة تُظهر المساحات، الإضاءة، والتفاصيل بدقة.',
  },
  {
    icon: Video,
    title: 'تصوير فيديو سينمائي',
    description: 'فيديو احترافي للعقار يعكس التجربة الحقيقية ويزيد التفاعل.',
  },
]

const DEFAULT_WHY_US = [
  'خبرة في إبراز جمال المساحات المعمارية',
  'فهم عميق لزوايا التصوير العقاري',
  'سرعة في التسليم',
  'جودة احترافية عالية',
  'تصوير يساعد على البيع والتسويق',
  'اهتمام بالتفاصيل الصغيرة',
]

const DEFAULT_STEPS = [
  'تواصل معنا وحدد احتياجك',
  'معاينة العقار أو معرفة التفاصيل',
  'تحديد موعد التصوير',
  'تنفيذ الجلسة باحترافية',
  'تسليم الصور والفيديو خلال الوقت المتفق',
]

// Helper to parse content_blocks rows into a flat map
type ContentMap = Record<string, string>
type ListsMap   = Record<string, string[]>

// ── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
}

export default function App() {
  const [packages, setPackages] = useState<Package[]>([])
  const [terms, setTerms] = useState<TermsCondition[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [videos, setVideos] = useState<VideoType[]>([])
  const [settings, setSettings] = useState<SettingsMap>({})
  const [content, setContent] = useState<ContentMap>({})
  const [lists, setLists] = useState<ListsMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const [pkgRes, termsRes, portfolioRes, videoRes, settingsRes, contentRes] = await Promise.all([
        supabase.from('packages').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('terms_conditions').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('portfolio_items').select('*').eq('is_visible', true).order('sort_order'),
        supabase.from('videos').select('*').eq('is_visible', true).order('sort_order'),
        supabase.from('site_settings').select('key, value'),
        supabase.from('content_blocks').select('section, key, value'),
      ])

      if (pkgRes.data) setPackages(pkgRes.data)
      if (termsRes.data) setTerms(termsRes.data)
      if (portfolioRes.data) setPortfolio(portfolioRes.data)
      if (videoRes.data) setVideos(videoRes.data)

      if (settingsRes.data) {
        const map: SettingsMap = {}
        settingsRes.data.forEach(s => { map[s.key] = s.value })
        setSettings(map)
      }

      if (contentRes.data) {
        const cmap: ContentMap = {}
        const lmap: ListsMap = {}
        contentRes.data.forEach(row => {
          if (row.key === 'items' || row.key === 'steps') {
            try { lmap[row.section] = JSON.parse(row.value) } catch { /* ignore */ }
          } else {
            cmap[`${row.section}__${row.key}`] = row.value
          }
        })
        setContent(cmap)
        setLists(lmap)
      }

      setLoading(false)
    }
    fetchAll()
  }, [])

  // Helper to read a content block with fallback
  const c = (section: string, key: string, fallback = '') =>
    content[`${section}__${key}`] || fallback

  const whyUsItems = lists['why_us']?.length ? lists['why_us'] : DEFAULT_WHY_US
  const steps      = lists['process']?.length  ? lists['process']  : DEFAULT_STEPS

  const whatsappNumber = settings.whatsapp_number || DEFAULT_WHATSAPP
  const instagramHandle = settings.instagram_handle || DEFAULT_INSTAGRAM
  const whatsappUrl = `https://wa.me/${whatsappNumber}`
  const instagramUrl = `https://www.instagram.com/${instagramHandle}`

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 right-0 left-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#d4af37]/20"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-8 h-8 text-[#d4af37]" />
            <span className="font-bold tracking-wider" style={{ fontSize: '1.5rem' }}>
              {settings.business_name || 'Enphost'}
            </span>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] px-6 py-2.5 rounded-full hover:scale-105 transition-transform duration-300 font-semibold shadow-lg shadow-[#d4af37]/30"
          >
            تواصل معنا
          </a>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1767950470198-c9cd97f8ed87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Luxury Villa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/90 via-[#0a0a0f]/80 to-[#0a0a0f]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/5 to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1
              className="mb-6 leading-tight"
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                fontFamily: "'Tajawal', sans-serif",
                fontWeight: 800,
                background: 'linear-gradient(135deg, #ffffff 0%, #d4af37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {c('hero','headline','نحوّل العقار إلى تجربة بصرية تبيع قبل الزيارة')}
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-4 text-gray-300 max-w-3xl mx-auto leading-relaxed"
            style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)' }}
          >
            {c('hero','subtitle','تصوير احترافي للعقارات، الفلل، المشاريع، الشقق، والفنادق')}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-12 text-[#d4af37] max-w-3xl mx-auto"
            style={{ fontSize: 'clamp(1rem, 1.8vw, 1.2rem)' }}
          >
            {c('hero','tagline','بإخراج بصري يعكس الفخامة، يرفع قيمة العقار، ويزيد فرص البيع والتأجير')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] px-10 py-4 rounded-full hover:scale-105 transition-all duration-300 font-bold shadow-2xl shadow-[#d4af37]/40 hover:shadow-[#d4af37]/60"
              style={{ fontSize: '1.2rem' }}
            >
              اطلب جلسة تصوير
            </a>
            <a
              href="#portfolio"
              className="border-2 border-[#d4af37] text-[#d4af37] px-10 py-4 rounded-full hover:bg-[#d4af37] hover:text-[#0a0a0f] transition-all duration-300 font-bold"
              style={{ fontSize: '1.2rem' }}
            >
              شاهد أعمالنا
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1, repeat: Infinity, repeatType: 'reverse' }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          >
            <ChevronDown className="w-8 h-8 text-[#d4af37]" />
          </motion.div>
        </div>
      </section>

      {/* ── Services ───────────────────────────────────────────────────────── */}
      <section className="py-32 bg-gradient-to-b from-[#0a0a0f] via-[#0f0f16] to-[#0a0a0f] relative">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #d4af37 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
            <h2 className="mb-4 font-bold" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontFamily: "'Tajawal', sans-serif", color: '#d4af37' }}>خدماتنا</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto" />
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {STATIC_SERVICES.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="bg-gradient-to-br from-[#1a1a24] to-[#0f0f16] p-8 rounded-2xl border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all duration-300 shadow-xl hover:shadow-[#d4af37]/20 group"
              >
                <service.icon className="w-14 h-14 text-[#d4af37] mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="mb-4 font-bold" style={{ fontSize: '1.5rem' }}>{service.title}</h3>
                <p className="text-gray-400 leading-relaxed" style={{ fontSize: '1.05rem' }}>{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Us ─────────────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
            <h2 className="mb-4 font-bold" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontFamily: "'Tajawal', sans-serif", color: '#d4af37' }}>لماذا يختارنا عملاؤنا؟</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto" />
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {whyUsItems.map((reason, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-r from-[#1a1a24] to-[#0f0f16] p-6 rounded-xl border-r-4 border-[#d4af37] hover:border-r-8 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-[#d4af37] rounded-full group-hover:scale-150 transition-transform duration-300" />
                  <p className="font-semibold" style={{ fontSize: '1.15rem' }}>{reason}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Packages ───────────────────────────────────────────────────────── */}
      <section className="py-32 bg-gradient-to-b from-[#0a0a0f] via-[#0f0f16] to-[#0a0a0f] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #d4af37 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
            <h2 className="mb-4 font-bold" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontFamily: "'Tajawal', sans-serif", color: '#d4af37' }}>باقاتنا</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-6" style={{ fontSize: '1.2rem' }}>اختر الباقة المناسبة لاحتياجاتك</p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto" />
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-96" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative bg-gradient-to-br from-[#1a1a24] to-[#0f0f16] p-8 rounded-3xl border-2 transition-all duration-300 hover:scale-105 ${pkg.is_popular ? 'border-[#d4af37] shadow-2xl shadow-[#d4af37]/30' : 'border-[#d4af37]/20 hover:border-[#d4af37]/50'}`}
                >
                  {pkg.is_popular && (
                    <div className="absolute -top-4 right-1/2 transform translate-x-1/2 bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] px-6 py-2 rounded-full font-bold shadow-lg">
                      الأكثر طلباً
                    </div>
                  )}
                  <div className="text-center mb-8">
                    <h3 className="mb-4 font-bold" style={{ fontSize: '1.8rem' }}>{pkg.name}</h3>
                    <div className="flex items-baseline justify-center gap-2 mb-2">
                      <span className="font-bold text-[#d4af37]" style={{ fontSize: '3.5rem' }}>{pkg.price.toLocaleString('ar-SA')}</span>
                      <span className="text-gray-400" style={{ fontSize: '1.5rem' }}>ريال</span>
                    </div>
                  </div>
                  <div className="space-y-4 mb-8">
                    {pkg.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-[#d4af37] rounded-full mt-2 flex-shrink-0" />
                        <p className="text-gray-300" style={{ fontSize: '1.05rem' }}>{feature}</p>
                      </div>
                    ))}
                  </div>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block w-full text-center py-4 rounded-full font-bold transition-all duration-300 hover:scale-105 shadow-lg ${pkg.is_popular ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] hover:shadow-[#d4af37]/50' : 'border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0a0a0f]'}`}
                    style={{ fontSize: '1.1rem' }}
                  >
                    احجز الآن
                  </a>
                </motion.div>
              ))}
            </div>
          )}

          {/* Terms & Conditions */}
          {!loading && terms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto mt-20 bg-gradient-to-br from-[#1a1a24] to-[#0f0f16] rounded-3xl border border-[#d4af37]/20 p-8 md:p-10"
            >
              <div className="flex items-center gap-3 mb-8">
                <ScrollText className="w-7 h-7 text-[#d4af37] flex-shrink-0" />
                <h3 className="font-bold text-[#d4af37]" style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontFamily: "'Tajawal', sans-serif" }}>
                  الشروط والأحكام
                </h3>
              </div>
              <ul className="space-y-4">
                {terms.map((term, index) => (
                  <motion.li
                    key={term.id}
                    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.06 }}
                    className="flex items-start gap-3"
                  >
                    <span className="text-[#d4af37] mt-1 flex-shrink-0 leading-none" style={{ fontSize: '0.9rem' }}>◄</span>
                    <p className="text-gray-300 leading-relaxed" style={{ fontSize: '1.05rem' }}>{term.text}</p>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Portfolio ──────────────────────────────────────────────────────── */}
      <section id="portfolio" className="py-32 bg-gradient-to-b from-[#0a0a0f] via-[#0f0f16] to-[#0a0a0f]">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h2 className="mb-4 font-bold" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontFamily: "'Tajawal', sans-serif", color: '#d4af37' }}>أعمالنا</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto" />
          </motion.div>

          {/* Videos */}
          {loading ? (
            <Skeleton className="h-72 mb-16 max-w-5xl mx-auto" />
          ) : videos.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16">
              <h3 className="mb-8 font-bold text-center text-[#d4af37]" style={{ fontSize: '2rem' }}>فيديو سينمائي</h3>
              <div className="max-w-5xl mx-auto space-y-8">
                {videos.map(video => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                    className="relative overflow-hidden rounded-3xl border-2 border-[#d4af37]/30 hover:border-[#d4af37] transition-all duration-300 shadow-2xl shadow-[#d4af37]/20"
                  >
                    <video controls className="w-full aspect-video object-cover" poster={video.thumbnail_url || ''}>
                      <source src={video.public_url} type="video/mp4" />
                      المتصفح لا يدعم تشغيل الفيديو
                    </video>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : null}

          {/* Photos */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-[4/3]" />)}
            </div>
          ) : portfolio.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h3 className="mb-8 font-bold text-center text-[#d4af37]" style={{ fontSize: '2rem' }}>التصوير الفوتوغرافي</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolio.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    className="relative overflow-hidden rounded-2xl group cursor-pointer aspect-[4/3]"
                  >
                    <img
                      src={item.public_url}
                      alt={item.title || 'عمل تصوير عقاري'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : !loading ? (
            <div className="text-center py-20 text-gray-500">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p style={{ fontSize: '1.1rem' }}>الأعمال قيد الرفع — تابعنا قريباً</p>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Results ────────────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1757264119016-7e6b568b810d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920" alt="Background" className="w-full h-full object-cover opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-transparent to-[#0a0a0f]" />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center max-w-4xl mx-auto">
            <h2 className="mb-8 font-bold leading-tight" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontFamily: "'Tajawal', sans-serif", color: '#d4af37' }}>
              نحن لا نصور فقط…<br />نحن نساعدك على البيع
            </h2>
            <p className="mb-12 text-gray-300 leading-relaxed" style={{ fontSize: '1.3rem' }}>المحتوى البصري الاحترافي يرفع من:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['سرعة بيع العقار', 'ثقة العميل', 'عدد الاستفسارات', 'قيمة العلامة العقارية'].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 border border-[#d4af37]/30 rounded-2xl p-8 hover:border-[#d4af37] transition-all duration-300"
                >
                  <p className="font-bold" style={{ fontSize: '1.5rem' }}>{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/5 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 className="mb-8 font-bold" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontFamily: "'Tajawal', sans-serif", color: '#d4af37' }}>عن المصور</h2>
              <p className="text-gray-300 leading-relaxed mb-6" style={{ fontSize: '1.2rem' }}>
                {c('about','paragraph_1','أنا مصور عقاري متخصص في إبراز جمال المساحات المعمارية والعقارات بأسلوب احترافي يخدم التسويق والبيع.')}
              </p>
              <p className="text-gray-300 leading-relaxed" style={{ fontSize: '1.2rem' }}>
                {c('about','paragraph_2','أجمع بين الحس البصري، فهم التصميم، والخبرة في إخراج المحتوى الذي يخلق انطباعًا قويًا من أول نظرة.')}
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative">
              <div className="relative rounded-3xl overflow-hidden">
                <img
                  src={c('about','image_url','https://images.unsplash.com/photo-1622015663084-307d19eabbbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080')}
                  alt="عن المصور"
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent opacity-50" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#d4af37] opacity-20 blur-3xl" />
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#d4af37] opacity-20 blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Process ────────────────────────────────────────────────────────── */}
      <section className="py-32 bg-gradient-to-b from-[#0a0a0f] via-[#0f0f16] to-[#0a0a0f]">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
            <h2 className="mb-4 font-bold" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontFamily: "'Tajawal', sans-serif", color: '#d4af37' }}>كيف نعمل؟</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto" />
          </motion.div>
          <div className="max-w-3xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex items-start gap-6 mb-8 group"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-[#d4af37] to-[#f4d799] rounded-full flex items-center justify-center font-bold group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#d4af37]/30" style={{ fontSize: '1.5rem' }}>
                  {index + 1}
                </div>
                <div className="flex-1 bg-gradient-to-r from-[#1a1a24] to-[#0f0f16] p-6 rounded-2xl border border-[#d4af37]/20 group-hover:border-[#d4af37]/50 transition-all duration-300">
                  <p className="font-semibold" style={{ fontSize: '1.3rem' }}>{step}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center max-w-4xl mx-auto">
            <h2 className="mb-6 font-bold leading-tight" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontFamily: "'Tajawal', sans-serif", color: '#d4af37' }}>
              {c('contact','headline','جاهز لإظهار عقارك بأفضل صورة؟')}
            </h2>
            <p className="mb-12 text-gray-300" style={{ fontSize: '1.3rem' }}>
              {c('contact','subtitle','تواصل معنا الآن واحصل على تجربة تصوير احترافية ترفع من قيمة مشروعك')}
            </p>
            <div className="flex flex-wrap gap-6 justify-center">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white px-10 py-5 rounded-full transition-all duration-300 font-bold shadow-2xl hover:scale-105"
                style={{ fontSize: '1.2rem' }}>
                <MessageCircle className="w-6 h-6" />
                واتساب
              </a>
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gradient-to-r from-[#E1306C] to-[#C13584] text-white px-10 py-5 rounded-full hover:scale-105 transition-all duration-300 font-bold shadow-2xl"
                style={{ fontSize: '1.2rem' }}>
                <Instagram className="w-6 h-6" />
                إنستغرام
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0a0a0f] border-t border-[#d4af37]/20 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-8 h-8 text-[#d4af37]" />
                <span className="font-bold" style={{ fontSize: '1.5rem' }}>{settings.business_name || 'Enphost'}</span>
              </div>
              <p className="text-gray-400" style={{ fontSize: '1rem' }}>تصوير احترافي يرفع قيمة عقارك</p>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-[#d4af37]" style={{ fontSize: '1.2rem' }}>التواصل</h3>
              <div className="space-y-2">
                <p className="text-gray-400" dir="ltr" style={{ fontSize: '1.1rem' }}>
                  {settings.whatsapp_number ? `0${settings.whatsapp_number.slice(3)}` : '0599991078'}
                </p>
                <p className="text-gray-400" style={{ fontSize: '1.1rem' }}>{settings.email || 'info@photographer.com'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-[#d4af37]" style={{ fontSize: '1.2rem' }}>تابعنا</h3>
              <div className="flex gap-4">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="w-6 h-6" />
                </a>
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-r from-[#E1306C] to-[#C13584] rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                  <Instagram className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-[#d4af37]/20 pt-8 text-center">
            <p className="text-gray-400" style={{ fontSize: '1rem' }}>© 2026 جميع الحقوق محفوظة - {settings.business_name || 'Enphost'}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
