import { useState } from 'react'
import { Routes, Route, useLocation, useNavigate, Link } from 'react-router'
import {
  Camera, LayoutDashboard, Images, Video,
  Package, FileText, ScrollText, ReceiptText, FileSignature, Settings as SettingsIcon, LogOut, Menu, X
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import Overview from './Overview'
import Portfolio from './Portfolio'
import Videos from './Videos'
import Packages from './Packages'
import Content from './Content'
import Terms from './Terms'
import Quotations from './Quotations'
import Contracts from './Contracts'
import Settings from './Settings'

// Placeholder for phases 3 sections still to come
const ComingSoon = ({ title }: { title: string }) => (
  <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }} className="flex flex-col items-center justify-center h-64 text-center">
    <div className="w-16 h-16 bg-[#d4af37]/10 rounded-2xl flex items-center justify-center mb-4">
      <span className="text-3xl">🚧</span>
    </div>
    <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
    <p className="text-gray-400 text-sm">هذا القسم قيد الإنشاء — سيكون جاهزاً قريباً</p>
  </div>
)

const navItems = [
  { path: '/admin', label: 'الرئيسية', icon: LayoutDashboard, exact: true },
  { path: '/admin/portfolio', label: 'البورتفوليو', icon: Images },
  { path: '/admin/videos', label: 'الفيديوهات', icon: Video },
  { path: '/admin/packages', label: 'الباقات', icon: Package },
  { path: '/admin/content', label: 'المحتوى', icon: FileText },
  { path: '/admin/terms', label: 'الشروط والأحكام', icon: ScrollText },
  { path: '/admin/quotations', label: 'عروض الأسعار', icon: ReceiptText },
  { path: '/admin/contracts', label: 'العقود', icon: FileSignature },
  { path: '/admin/settings', label: 'الإعدادات', icon: SettingsIcon },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path) && path !== '/admin'
      || (path === '/admin' && location.pathname === '/admin')
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-[#0f0f16] border-l border-[#d4af37]/10 w-64 flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#d4af37]/10">
        <div className="w-9 h-9 bg-gradient-to-br from-[#d4af37] to-[#f4d799] rounded-xl flex items-center justify-center flex-shrink-0">
          <Camera className="w-5 h-5 text-[#0a0a0f]" />
        </div>
        <div>
          <p className="text-white font-bold leading-none">Enphost</p>
          <p className="text-gray-500 text-xs mt-0.5">لوحة التحكم</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = isActive(item.path, item.exact)
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[#d4af37]/10 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Camera className="w-5 h-5" />
          عرض الموقع
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-[#d4af37]/10 bg-[#0f0f16]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#d4af37]" />
            <span className="text-white font-bold">Enphost</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white transition-colors opacity-0 pointer-events-none"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="videos" element={<Videos />} />
            <Route path="packages" element={<Packages />} />
            <Route path="content" element={<Content />} />
            <Route path="terms" element={<Terms />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
