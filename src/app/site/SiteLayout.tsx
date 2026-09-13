import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Camera, Instagram, Mail, Menu, MessageCircle, Phone, X } from 'lucide-react'
import { SiteDataProvider, useSite } from './SiteData'
import { ButtonLink, Container } from './ui'

export const NAV_LINKS = [
  { to: '/', label: 'الرئيسية' },
  { to: '/portfolio', label: 'أعمالنا' },
  { to: '/packages', label: 'الباقات' },
  { to: '/about', label: 'عن المصور' },
]

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
  }, [pathname, hash])
  return null
}

function Brand({ name }: { name: string }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label={`${name} — الصفحة الرئيسية`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-gold to-gold-soft">
        <Camera className="h-5 w-5 text-ink" aria-hidden />
      </span>
      <span className="text-xl font-bold tracking-wide text-white">{name}</span>
    </Link>
  )
}

function Header() {
  const site = useSite()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3 py-2 text-[0.95rem] font-semibold transition-colors ${
      isActive ? 'text-gold' : 'text-gray-300 hover:text-white'
    }`

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? 'border-b border-white/5 bg-ink/85 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <Container className="flex h-16 items-center justify-between md:h-20">
        <Brand name={site.businessName} />

        <nav aria-label="القائمة الرئيسية" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(link => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink to={site.whatsappUrl('مرحباً، أرغب بحجز جلسة تصوير')} external variant="primary" className="hidden sm:inline-flex">
            احجز جلسة
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="grid h-11 w-11 place-items-center rounded-full text-gray-200 hover:bg-white/5 md:hidden"
            aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </Container>

      {open && (
        <nav id="mobile-nav" aria-label="القائمة" className="border-t border-white/5 md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-base font-semibold ${isActive ? 'bg-gold/10 text-gold' : 'text-gray-200 hover:bg-white/5'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <ButtonLink to={site.whatsappUrl('مرحباً، أرغب بحجز جلسة تصوير')} external variant="primary" className="mt-3 w-full">
              احجز جلسة تصوير
            </ButtonLink>
          </Container>
        </nav>
      )}
    </header>
  )
}

function Footer() {
  const site = useSite()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 bg-ink-2">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 md:py-16 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Brand name={site.businessName} />
          <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-gray-400">
            تصوير عقاري احترافي للفلل والشقق والمشاريع والفنادق — صور وفيديو سينمائي يرفع قيمة عقارك.
          </p>
        </div>

        <nav aria-label="روابط الموقع">
          <h2 className="mb-4 text-base font-bold text-white">روابط</h2>
          <ul className="space-y-2.5 text-[0.95rem]">
            {[...NAV_LINKS, { to: '/terms', label: 'الشروط والأحكام' }].map(link => (
              <li key={link.to}>
                <Link to={link.to} className="text-gray-400 transition-colors hover:text-gold">{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-4 text-base font-bold text-white">تواصل معنا</h2>
          <ul className="space-y-2.5 text-[0.95rem]">
            <li>
              <a href={site.phoneHref} className="inline-flex items-center gap-2 text-gray-400 hover:text-gold">
                <Phone className="h-4 w-4" aria-hidden />
                <span dir="ltr">{site.phoneDisplay}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-gold">
                <Mail className="h-4 w-4" aria-hidden />
                {site.email}
              </a>
            </li>
          </ul>
          <div className="mt-5 flex gap-3">
            <a href={site.whatsappUrl()} target="_blank" rel="noopener noreferrer" aria-label="واتساب"
              className="grid h-10 w-10 place-items-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-110">
              <MessageCircle className="h-5 w-5" />
            </a>
            <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="إنستغرام"
              className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-l from-[#E1306C] to-[#C13584] text-white transition-transform hover:scale-110">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </Container>

      <div className="border-t border-white/5">
        <Container className="py-6 text-center text-sm text-gray-500">
          © {year} {site.businessName} — جميع الحقوق محفوظة
        </Container>
      </div>
    </footer>
  )
}

function FloatingWhatsApp() {
  const site = useSite()
  return (
    <a
      href={site.whatsappUrl('مرحباً، أرغب بالاستفسار عن التصوير')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل عبر واتساب"
      className="fixed bottom-5 left-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/40 transition-transform hover:scale-110 md:bottom-8 md:left-8"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  )
}

export default function SiteLayout() {
  return (
    <SiteDataProvider>
      <div className="site min-h-screen bg-ink font-body text-white antialiased" dir="rtl">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-[60] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-ink">
          تخطَّ إلى المحتوى
        </a>
        <ScrollManager />
        <Header />
        <main id="main">
          <Outlet />
        </main>
        <Footer />
        <FloatingWhatsApp />
      </div>
    </SiteDataProvider>
  )
}
