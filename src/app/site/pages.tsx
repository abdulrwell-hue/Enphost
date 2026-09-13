import { Link } from 'react-router'
import { SITE_URL, breadcrumbLd, useSeo } from './seo'
import { useSite, useTable } from './SiteData'
import { ButtonLink, PageHeader, Section, SectionHeading, Skeleton } from './ui'
import {
  AboutIntro, AddonsSection, ContactCta, Hero, PackagesSection, PhotoGrid, Process, Services, TermsList, VideoList, WhyUs, WorkPreview,
} from './sections'

// ── /  ──────────────────────────────────────────────────────────────────────
export function HomePage() {
  const site = useSite()
  const packages = useTable('packages')
  const photos = useTable('portfolio')
  const videos = useTable('videos')

  const prices = packages.data.flatMap(p => [Number(p.price), Number(p.price_max ?? p.price)]).filter(n => n > 0)

  useSeo({
    path: '/',
    description: 'تصوير عقاري احترافي للفلل والشقق والمشاريع والفنادق في السعودية. صور عالية الجودة وفيديو سينمائي يرفع قيمة العقار ويسرّع البيع والتأجير.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        '@id': `${SITE_URL}/#business`,
        name: site.businessName,
        description: 'تصوير عقاري احترافي — صور وفيديو سينمائي للعقارات، الفلل، المشاريع، الشقق، والفنادق.',
        url: `${SITE_URL}/`,
        image: 'https://images.unsplash.com/photo-1767950470198-c9cd97f8ed87?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1200&h=630',
        telephone: site.phoneIntl,
        email: site.email,
        areaServed: { '@type': 'Country', name: 'Saudi Arabia' },
        address: { '@type': 'PostalAddress', addressCountry: 'SA' },
        sameAs: [site.instagramUrl],
        ...(prices.length ? { priceRange: `${Math.min(...prices)} - ${Math.max(...prices)} SAR` } : {}),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: site.businessName,
        url: `${SITE_URL}/`,
        inLanguage: 'ar',
      },
    ],
  })

  return (
    <>
      <Hero />
      <Services />
      <WorkPreview photos={photos.data} videos={videos.data} loading={photos.loading || videos.loading} />
      <PackagesSection packages={packages.data} loading={packages.loading} />
      <Process />
      <ContactCta />
    </>
  )
}

// ── /portfolio ──────────────────────────────────────────────────────────────
export function PortfolioPage() {
  const photos = useTable('portfolio')
  const videos = useTable('videos')

  useSeo({
    title: 'أعمالنا — معرض التصوير العقاري',
    path: '/portfolio',
    description: 'معرض أعمال Enphost في التصوير العقاري: صور احترافية وفيديوهات سينمائية لفلل وشقق ومشاريع وفنادق.',
    image: photos.data[0]?.public_url,
    jsonLd: [breadcrumbLd([{ name: 'الرئيسية', path: '/' }, { name: 'أعمالنا', path: '/portfolio' }])],
  })

  return (
    <>
      <PageHeader
        eyebrow="معرض الأعمال"
        title="أعمالنا"
        lead="مختارات من جلسات التصوير العقاري والفيديو السينمائي — كل صورة مصمّمة لتُظهر أفضل ما في المساحة."
      />

      {(videos.loading || videos.data.length > 0) && (
        <Section labelledBy="videos-title">
          <SectionHeading id="videos-title" eyebrow="فيديو" title="فيديو سينمائي" />
          {videos.loading ? <Skeleton className="mx-auto aspect-video max-w-4xl" /> : <VideoList videos={videos.data} />}
        </Section>
      )}

      <Section tone={videos.data.length ? 'raised' : 'plain'} labelledBy="photos-title">
        <SectionHeading id="photos-title" eyebrow="صور" title="التصوير الفوتوغرافي" />
        <PhotoGrid items={photos.data} loading={photos.loading} skeletons={9} />
      </Section>

      <ContactCta />
    </>
  )
}

// ── /packages ───────────────────────────────────────────────────────────────
export function PackagesPage() {
  const site = useSite()
  const packages = useTable('packages')
  const addons = useTable('addons')

  useSeo({
    title: 'الباقات والأسعار',
    path: '/packages',
    description: 'باقات وأسعار التصوير العقاري من Enphost — اختر الباقة المناسبة لشقتك أو فيلتك أو مشروعك مع مدة تسليم واضحة.',
    jsonLd: [
      breadcrumbLd([{ name: 'الرئيسية', path: '/' }, { name: 'الباقات', path: '/packages' }]),
      ...(packages.data.length
        ? [{
            '@context': 'https://schema.org',
            '@type': 'Service',
            serviceType: 'تصوير عقاري',
            provider: { '@id': `${SITE_URL}/#business` },
            areaServed: { '@type': 'Country', name: 'Saudi Arabia' },
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: `باقات ${site.businessName}`,
              itemListElement: packages.data.map(p => ({
                '@type': 'Offer',
                name: p.name,
                description: p.features.filter(Boolean).join('، '),
                priceCurrency: 'SAR',
                priceSpecification: {
                  '@type': 'PriceSpecification',
                  priceCurrency: 'SAR',
                  minPrice: Number(p.price) || 0,
                  ...(p.price_max != null ? { maxPrice: Number(p.price_max) } : {}),
                },
              })),
            },
          }]
        : []),
    ],
  })

  return (
    <>
      <PageHeader
        eyebrow="الأسعار"
        title="الباقات والأسعار"
        lead="باقات واضحة تناسب كل نوع عقار — وتقدر تضيف خدمات مثل الدرون والجولات الافتراضية حسب احتياجك."
      />
      <PackagesSection packages={packages.data} loading={packages.loading} withHeading={false} />
      <AddonsSection addons={addons.data} loading={addons.loading} />
      <Process />
      <ContactCta />
    </>
  )
}

// ── /about ──────────────────────────────────────────────────────────────────
export function AboutPage() {
  useSeo({
    title: 'عن المصور',
    path: '/about',
    description: 'تعرّف على Enphost — مصور عقاري متخصص في إبراز جمال المساحات المعمارية بأسلوب احترافي يخدم التسويق والبيع.',
    jsonLd: [breadcrumbLd([{ name: 'الرئيسية', path: '/' }, { name: 'عن المصور', path: '/about' }])],
  })

  return (
    <>
      <PageHeader eyebrow="من نحن" title="عن المصور" lead="حس بصري، فهم للتصميم، وخبرة في إخراج محتوى يترك انطباعًا قويًا من أول نظرة." />
      <AboutIntro />
      <WhyUs />
      <ContactCta />
    </>
  )
}

// ── /terms ──────────────────────────────────────────────────────────────────
export function TermsPage() {
  const terms = useTable('terms')

  useSeo({
    title: 'الشروط والأحكام',
    path: '/terms',
    description: 'الشروط والأحكام الخاصة بحجز جلسات التصوير العقاري والفيديو لدى Enphost.',
    jsonLd: [breadcrumbLd([{ name: 'الرئيسية', path: '/' }, { name: 'الشروط والأحكام', path: '/terms' }])],
  })

  return (
    <>
      <PageHeader eyebrow="قبل الحجز" title="الشروط والأحكام" lead="نحرص على الوضوح الكامل — هذه الشروط تنظّم الحجز والتصوير والتسليم." />
      <Section>
        <div className="mx-auto max-w-3xl">
          {terms.loading ? (
            <div className="space-y-3">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>
          ) : terms.data.length ? (
            <TermsList terms={terms.data} />
          ) : (
            <p className="text-center text-gray-400">لا توجد شروط منشورة حالياً.</p>
          )}
          <div className="mt-10 text-center">
            <ButtonLink to="/packages" variant="outline">تصفّح الباقات</ButtonLink>
          </div>
        </div>
      </Section>
    </>
  )
}

// ── 404 ─────────────────────────────────────────────────────────────────────
export function NotFoundPage() {
  useSeo({ title: 'الصفحة غير موجودة', path: '/404', description: 'الصفحة المطلوبة غير موجودة.', noindex: true })

  return (
    <section className="flex min-h-[80svh] items-center justify-center px-5 pt-20 text-center">
      <div>
        <p className="font-display text-7xl font-extrabold text-gold md:text-8xl" dir="ltr">404</p>
        <h1 className="mt-4 font-display text-3xl font-bold text-white md:text-4xl">الصفحة غير موجودة</h1>
        <p className="mt-3 text-base text-gray-400">ربما تم نقل الصفحة أو أن الرابط غير صحيح.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink to="/">العودة للرئيسية</ButtonLink>
          <Link to="/portfolio" className="inline-flex h-11 items-center justify-center px-6 font-bold text-gold hover:underline">شاهد أعمالنا</Link>
        </div>
      </div>
    </section>
  )
}
