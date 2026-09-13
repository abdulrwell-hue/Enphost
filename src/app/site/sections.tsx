import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Camera, Check, Clock, Home, Images, MessageCircle, Instagram, Plus, Video } from 'lucide-react'
import type { Package, PortfolioItem, Video as VideoType } from '../../lib/types'
import { formatRange, type Addon } from '../../lib/catalog'
import { DEFAULT_STEPS, DEFAULT_WHY_US, useSite } from './SiteData'
import { ButtonLink, Container, Reveal, Section, SectionHeading, Skeleton } from './ui'
import Lightbox from './Lightbox'

const HERO_IMG = 'https://images.unsplash.com/photo-1767950470198-c9cd97f8ed87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=75'

// ── Hero ────────────────────────────────────────────────────────────────────
export function Hero() {
  const site = useSite()
  return (
    <header className="relative isolate flex min-h-[88svh] items-center overflow-hidden pt-24 pb-16 md:min-h-[92svh]">
      <img
        src={`${HERO_IMG}&w=1920`}
        srcSet={`${HERO_IMG}&w=768 768w, ${HERO_IMG}&w=1280 1280w, ${HERO_IMG}&w=1920 1920w`}
        sizes="100vw"
        alt="فيلا فاخرة بتصوير عقاري احترافي"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        decoding="async"
        {...{ fetchpriority: 'high' }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/90 via-ink/75 to-ink" aria-hidden />

      <Container className="text-center">
        <Reveal>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-ink/40 px-4 py-1.5 text-sm font-semibold text-gold backdrop-blur">
            <Camera className="h-4 w-4" aria-hidden />
            تصوير عقاري احترافي
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="mx-auto max-w-4xl bg-gradient-to-l from-white via-white to-gold-soft bg-clip-text font-display text-4xl font-extrabold text-transparent sm:text-5xl lg:text-6xl">
            {site.text('hero', 'headline', 'نحوّل العقار إلى تجربة بصرية تبيع قبل الزيارة')}
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-200 md:text-xl">
            {site.text('hero', 'subtitle', 'تصوير احترافي للعقارات، الفلل، المشاريع، الشقق، والفنادق')}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gold md:text-lg">
            {site.text('hero', 'tagline', 'بإخراج بصري يعكس الفخامة، يرفع قيمة العقار، ويزيد فرص البيع والتأجير')}
          </p>
        </Reveal>
        <Reveal delay={0.15} className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <ButtonLink to={site.whatsappUrl('مرحباً، أرغب بحجز جلسة تصوير')} external size="lg">
            اطلب جلسة تصوير
          </ButtonLink>
          <ButtonLink to="/portfolio" variant="outline" size="lg">
            شاهد أعمالنا
          </ButtonLink>
        </Reveal>
      </Container>
    </header>
  )
}

// ── Services ────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: Camera,
    title: 'تصوير عقاري احترافي',
    description: 'صور داخلية وخارجية عالية الجودة تُظهر المساحات، الإضاءة، والتفاصيل بدقة.',
  },
  {
    icon: Video,
    title: 'تصوير فيديو سينمائي',
    description: 'فيديو احترافي للعقار يعكس التجربة الحقيقية ويزيد التفاعل على المنصات.',
  },
]

export function Services() {
  return (
    <Section tone="raised" labelledBy="services-title">
      <SectionHeading id="services-title" eyebrow="ماذا نقدّم" title="خدماتنا" />
      <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2 md:gap-6">
        {SERVICES.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.08} className="h-full">
            <article className="group h-full rounded-2xl border border-white/8 bg-card p-6 transition-colors duration-300 hover:border-gold/40 md:p-8">
              <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gold/10 text-gold transition-colors group-hover:bg-gold group-hover:text-ink">
                <s.icon className="h-7 w-7" aria-hidden />
              </span>
              <h3 className="mb-3 text-xl font-bold text-white md:text-2xl">{s.title}</h3>
              <p className="text-base leading-relaxed text-gray-400">{s.description}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

// ── Portfolio ───────────────────────────────────────────────────────────────
export function PhotoGrid({ items, loading, skeletons = 6 }: { items: PortfolioItem[]; loading: boolean; skeletons?: number }) {
  const [active, setActive] = useState<number | null>(null)

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
        {Array.from({ length: skeletons }, (_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-gray-500">
        <Images className="mx-auto mb-4 h-12 w-12 opacity-40" aria-hidden />
        <p className="text-base">الأعمال قيد الرفع — تابعنا قريباً</p>
      </div>
    )
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
        {items.map((item, i) => (
          <Reveal as="li" key={item.id} delay={Math.min(i, 5) * 0.04}>
            <button
              type="button"
              onClick={() => setActive(i)}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              aria-label={`عرض الصورة: ${item.title || `عمل رقم ${i + 1}`}`}
            >
              <img
                src={item.public_url}
                alt={item.title || 'تصوير عقاري احترافي'}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
              {item.title && (
                <span className="absolute inset-x-0 bottom-0 translate-y-2 p-4 text-start text-sm font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {item.title}
                </span>
              )}
            </button>
          </Reveal>
        ))}
      </ul>
      {active !== null && <Lightbox items={items} index={active} onIndex={setActive} onClose={() => setActive(null)} />}
    </>
  )
}

export function VideoList({ videos }: { videos: VideoType[] }) {
  return (
    <div className={`grid gap-5 md:gap-6 ${videos.length > 1 ? 'lg:grid-cols-2' : 'mx-auto max-w-4xl'}`}>
      {videos.map(video => (
        <Reveal key={video.id}>
          <figure className="overflow-hidden rounded-2xl border border-white/8 bg-card">
            <video
              controls
              playsInline
              preload="metadata"
              poster={video.thumbnail_url || undefined}
              className="aspect-video w-full bg-black object-cover"
            >
              <source src={video.public_url} type="video/mp4" />
              المتصفح لا يدعم تشغيل الفيديو
            </video>
            {video.title && <figcaption className="px-5 py-3.5 text-[0.95rem] font-semibold text-gray-300">{video.title}</figcaption>}
          </figure>
        </Reveal>
      ))}
    </div>
  )
}

export function WorkPreview({
  photos, videos, loading,
}: { photos: PortfolioItem[]; videos: VideoType[]; loading: boolean }) {
  const featured = photos.filter(p => p.is_featured)
  const shown = (featured.length >= 3 ? featured : photos).slice(0, 6)

  return (
    <Section labelledBy="work-title">
      <SectionHeading id="work-title" eyebrow="من أعمالنا" title="صور تتحدث عن العقار" lead="نماذج مختارة من جلسات التصوير — المعرض الكامل في صفحة الأعمال." />
      {!loading && videos[0] && <div className="mb-8 md:mb-10"><VideoList videos={videos.slice(0, 1)} /></div>}
      <PhotoGrid items={shown} loading={loading} />
      {!loading && (photos.length > shown.length || videos.length > 1) && (
        <div className="mt-10 text-center">
          <ButtonLink to="/portfolio" variant="outline">
            شاهد كل الأعمال
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>
      )}
    </Section>
  )
}

// ── Packages ────────────────────────────────────────────────────────────────
function PackageCard({ pkg }: { pkg: Package }) {
  const site = useSite()
  const hasRange = pkg.price_max != null && pkg.price_max !== pkg.price

  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border bg-card p-6 md:p-8 ${
        pkg.is_popular ? 'border-gold shadow-2xl shadow-gold/10 lg:-translate-y-3' : 'border-white/8'
      }`}
    >
      {pkg.is_popular && (
        <span className="absolute -top-3.5 right-1/2 translate-x-1/2 rounded-full bg-gradient-to-l from-gold to-gold-soft px-4 py-1 text-sm font-bold text-ink shadow-lg">
          الأكثر طلباً
        </span>
      )}

      <header className="mb-6 border-b border-white/8 pb-6">
        <h3 className="text-xl font-bold text-white md:text-2xl">{pkg.name}</h3>
        {pkg.suitable_for && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-gray-400">
            <Home className="h-4 w-4 text-gold/80" aria-hidden />
            مناسبة لـ {pkg.suitable_for}
          </p>
        )}
        <p className="mt-5 text-sm text-gray-400">{hasRange ? 'السعر يبدأ من' : 'السعر'}</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-4xl font-extrabold text-gold md:text-[2.75rem]" dir="ltr">
            {formatRange(Number(pkg.price) || 0, pkg.price_max)}
          </span>
          <span className="text-base text-gray-400">ر.س</span>
        </p>
        {pkg.delivery && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-gray-400">
            <Clock className="h-4 w-4 text-gold/80" aria-hidden />
            التسليم خلال {pkg.delivery}
          </p>
        )}
      </header>

      <ul className="mb-8 flex-1 space-y-3">
        {pkg.features.filter(Boolean).map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-[0.95rem] leading-relaxed text-gray-300">
            <Check className="mt-1 h-4 w-4 flex-shrink-0 text-gold" aria-hidden />
            {f}
          </li>
        ))}
      </ul>

      <ButtonLink
        to={site.whatsappUrl(`مرحباً، أرغب بحجز ${pkg.name}`)}
        external
        variant={pkg.is_popular ? 'primary' : 'outline'}
        className="w-full"
      >
        احجز الآن
      </ButtonLink>
    </article>
  )
}

export function PackagesGrid({ packages, loading }: { packages: Package[]; loading: boolean }) {
  const cols = packages.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : packages.length === 1 ? 'max-w-md mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'

  if (loading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {[0, 1, 2].map(i => <Skeleton key={i} className="h-[28rem]" />)}
      </div>
    )
  }

  return (
    <div className={`grid gap-5 md:gap-6 ${cols}`}>
      {packages.map((pkg, i) => (
        <Reveal key={pkg.id} delay={i * 0.08} className="h-full">
          <PackageCard pkg={pkg} />
        </Reveal>
      ))}
    </div>
  )
}

export function PackagesSection({ packages, loading, withHeading = true }: { packages: Package[]; loading: boolean; withHeading?: boolean }) {
  return (
    <Section tone={withHeading ? 'raised' : 'plain'} labelledBy={withHeading ? 'packages-title' : undefined}>
      {withHeading && (
        <SectionHeading id="packages-title" eyebrow="الأسعار" title="باقاتنا" lead="اختر الباقة المناسبة لعقارك — ويمكن تخصيص أي باقة بخدمات إضافية حسب احتياجك." />
      )}
      <PackagesGrid packages={packages} loading={loading} />
      {!loading && (
        <p className="mt-10 text-center text-sm text-gray-400">
          بالحجز فإنك توافق على{' '}
          <Link to="/terms" className="font-semibold text-gold underline-offset-4 hover:underline">الشروط والأحكام</Link>
        </p>
      )}
    </Section>
  )
}

// ── Add-ons ─────────────────────────────────────────────────────────────────
function addonPrice(a: Addon) {
  const min = Number(a.price) || 0
  if (a.pricing_type === 'percent') return { value: `+${formatRange(min, a.price_max, '%')}`, unit: 'من قيمة الباقة' }
  if (!min && a.price_max == null) return { value: 'حسب الطلب', unit: '' }
  return { value: formatRange(min, a.price_max), unit: a.unit_label ? `ر.س / ${a.unit_label}` : 'ر.س' }
}

export function AddonsSection({ addons, loading }: { addons: Addon[]; loading: boolean }) {
  const site = useSite()
  if (!loading && !addons.length) return null

  return (
    <Section tone="raised" labelledBy="addons-title">
      <SectionHeading
        id="addons-title"
        eyebrow="خصّص باقتك"
        title="الخدمات الإضافية"
        lead="أضف ما يحتاجه عقارك إلى أي باقة — والأسعار تقريبية تُحدَّد بدقة حسب المشروع."
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {addons.map((a, i) => {
            const price = addonPrice(a)
            return (
              <Reveal as="li" key={a.id} delay={Math.min(i, 5) * 0.04} className="h-full">
                <article className="flex h-full flex-col rounded-2xl border border-white/8 bg-card p-5 transition-colors hover:border-gold/30 md:p-6">
                  <div className="mb-5 flex items-start gap-3">
                    <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
                      <Plus className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white md:text-lg">{a.name}</h3>
                      {a.description && <p className="mt-1 text-sm leading-relaxed text-gray-400">{a.description}</p>}
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-white/8 pt-4">
                    <p className="flex items-baseline gap-1.5">
                      <span className="font-display text-xl font-extrabold text-gold" dir={price.unit ? 'ltr' : undefined}>{price.value}</span>
                      {price.unit && <span className="text-sm text-gray-400">{price.unit}</span>}
                    </p>
                    {a.delivery && (
                      <p className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {a.delivery}
                      </p>
                    )}
                  </div>
                </article>
              </Reveal>
            )
          })}
        </ul>
      )}

      {!loading && (
        <div className="mt-10 text-center">
          <ButtonLink to={site.whatsappUrl('مرحباً، أرغب بتخصيص باقة مع خدمات إضافية')} external variant="outline">
            اطلب عرض سعر مخصّص
          </ButtonLink>
        </div>
      )}
    </Section>
  )
}

// ── Process ─────────────────────────────────────────────────────────────────
export function Process() {
  const site = useSite()
  const steps = site.list('process', DEFAULT_STEPS)

  return (
    <Section labelledBy="process-title">
      <SectionHeading id="process-title" eyebrow="خطوات بسيطة" title="كيف نعمل؟" />
      <ol className="mx-auto max-w-3xl space-y-4">
        {steps.map((step, i) => (
          <Reveal as="li" key={i} delay={i * 0.06} className="flex items-center gap-4 md:gap-5">
            <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-soft font-display text-lg font-extrabold text-ink md:h-14 md:w-14 md:text-xl">
              {i + 1}
            </span>
            <p className="flex-1 rounded-2xl border border-white/8 bg-card px-5 py-4 text-base font-semibold text-gray-100 md:px-6 md:text-lg">
              {step}
            </p>
          </Reveal>
        ))}
      </ol>
    </Section>
  )
}

// ── About / Why us ──────────────────────────────────────────────────────────
const DEFAULT_ABOUT_IMG = 'https://images.unsplash.com/photo-1622015663084-307d19eabbbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'

export function AboutIntro() {
  const site = useSite()
  return (
    <Section labelledBy="about-title">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <h2 id="about-title" className="mb-6 font-display text-3xl font-bold text-white md:text-4xl lg:text-[2.75rem]">
            شغف بإبراز المساحات
          </h2>
          <div className="space-y-4 text-base leading-loose text-gray-300 md:text-lg">
            <p>{site.text('about', 'paragraph_1', 'أنا مصور عقاري متخصص في إبراز جمال المساحات المعمارية والعقارات بأسلوب احترافي يخدم التسويق والبيع.')}</p>
            <p>{site.text('about', 'paragraph_2', 'أجمع بين الحس البصري، فهم التصميم، والخبرة في إخراج المحتوى الذي يخلق انطباعًا قويًا من أول نظرة.')}</p>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="relative">
          <div className="overflow-hidden rounded-2xl border border-white/8">
            <img
              src={site.text('about', 'image_url', DEFAULT_ABOUT_IMG)}
              alt="المصور العقاري أثناء العمل"
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full object-cover sm:aspect-square"
            />
          </div>
          <div className="pointer-events-none absolute -bottom-6 -left-6 -z-10 h-40 w-40 rounded-full bg-gold/20 blur-3xl" aria-hidden />
        </Reveal>
      </div>
    </Section>
  )
}

const OUTCOMES = ['سرعة بيع العقار', 'ثقة العميل', 'عدد الاستفسارات', 'قيمة العلامة العقارية']

export function WhyUs() {
  const site = useSite()
  const items = site.list('why_us', DEFAULT_WHY_US)

  return (
    <Section tone="raised" labelledBy="why-title">
      <SectionHeading id="why-title" eyebrow="لماذا نحن" title="لماذا يختارنا عملاؤنا؟" />
      <ul className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
        {items.map((reason, i) => (
          <Reveal as="li" key={i} delay={i * 0.05} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-card p-5 md:p-6">
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
              <Check className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-base font-semibold text-gray-100">{reason}</p>
          </Reveal>
        ))}
      </ul>

      <Reveal className="mt-14 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 to-transparent p-6 text-center md:mt-16 md:p-10">
        <h3 className="font-display text-2xl font-bold text-white md:text-3xl">نحن لا نصوّر فقط… نحن نساعدك على البيع</h3>
        <p className="mt-3 text-base text-gray-400 md:text-lg">المحتوى البصري الاحترافي يرفع من:</p>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {OUTCOMES.map(o => (
            <li key={o} className="rounded-xl border border-gold/20 bg-ink/40 px-3 py-4 text-sm font-bold text-gold md:text-base">{o}</li>
          ))}
        </ul>
      </Reveal>
    </Section>
  )
}

// ── Terms ───────────────────────────────────────────────────────────────────
export function TermsList({ terms }: { terms: { id: string; text: string }[] }) {
  return (
    <ol className="space-y-3">
      {terms.map((term, i) => (
        <li key={term.id} className="flex items-start gap-4 rounded-2xl border border-white/8 bg-card p-5 md:p-6">
          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-gold/10 text-sm font-bold text-gold">{i + 1}</span>
          <p className="pt-0.5 text-base leading-relaxed text-gray-300">{term.text}</p>
        </li>
      ))}
    </ol>
  )
}

// ── Call to action ──────────────────────────────────────────────────────────
export function ContactCta() {
  const site = useSite()
  return (
    <section aria-labelledby="cta-title" className="py-16 md:py-24">
      <Container>
        <Reveal className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-card to-ink-2 px-6 py-12 text-center md:px-12 md:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_0%,rgba(212,175,55,0.15),transparent)]" aria-hidden />
          <div className="relative">
            <h2 id="cta-title" className="mx-auto max-w-2xl font-display text-3xl font-bold text-white md:text-4xl">
              {site.text('contact', 'headline', 'جاهز لإظهار عقارك بأفضل صورة؟')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-400 md:text-lg">
              {site.text('contact', 'subtitle', 'تواصل معنا الآن واحصل على تجربة تصوير احترافية ترفع من قيمة مشروعك')}
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <ButtonLink to={site.whatsappUrl('مرحباً، أرغب بحجز جلسة تصوير')} external variant="whatsapp" size="lg">
                <MessageCircle className="h-5 w-5" aria-hidden />
                واتساب
              </ButtonLink>
              <ButtonLink to={site.instagramUrl} external variant="instagram" size="lg">
                <Instagram className="h-5 w-5" aria-hidden />
                إنستغرام
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
