import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'

// ── Design scale (one place for the whole public site) ──────────────────────
// Section rhythm   py-16 md:py-24
// Container        max-w-6xl, px-5 sm:px-6 lg:px-8
// Heading → body   mb-10 md:mb-14
// Card             rounded-2xl p-6 md:p-8, gap-5 md:gap-6
// Type             h1 4xl→6xl · h2 3xl→[2.75rem] · h3 xl→2xl · body base→lg

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8', className)}>{children}</div>
}

type Tone = 'plain' | 'raised'

export function Section({
  children, id, tone = 'plain', className, labelledBy,
}: { children: ReactNode; id?: string; tone?: Tone; className?: string; labelledBy?: string }) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx(
        'relative py-16 md:py-24',
        tone === 'raised' && 'bg-ink-2 border-y border-white/5',
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  )
}

export function Reveal({
  children, delay = 0, className, as = 'div',
}: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'li' }) {
  const reduce = useReducedMotion()
  const Tag = as === 'li' ? motion.li : motion.div
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </Tag>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gold">
      <span className="h-px w-6 bg-gold/60" aria-hidden />
      {children}
    </p>
  )
}

export function SectionHeading({
  id, eyebrow, title, lead, align = 'center', className,
}: { id?: string; eyebrow?: string; title: ReactNode; lead?: ReactNode; align?: 'center' | 'start'; className?: string }) {
  return (
    <Reveal className={cx('mb-10 md:mb-14', align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl', className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 id={id} className="font-display text-3xl font-bold text-white md:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {lead && <p className="mt-4 text-base leading-relaxed text-gray-400 md:text-lg">{lead}</p>}
    </Reveal>
  )
}

// ── Buttons ─────────────────────────────────────────────────────────────────
type Variant = 'primary' | 'outline' | 'ghost' | 'whatsapp' | 'instagram'
type Size = 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-l from-gold to-gold-soft text-ink shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:brightness-105',
  outline: 'border border-gold/60 text-gold hover:bg-gold hover:text-ink',
  ghost: 'text-gray-300 hover:text-white hover:bg-white/5',
  whatsapp: 'bg-[#25D366] text-white hover:bg-[#1fbd5a] shadow-lg shadow-black/20',
  instagram: 'bg-gradient-to-l from-[#E1306C] to-[#C13584] text-white hover:brightness-110 shadow-lg shadow-black/20',
}

const sizes: Record<Size, string> = {
  md: 'h-11 px-6 text-[0.95rem]',
  lg: 'h-12 px-7 text-base md:h-14 md:px-8 md:text-lg',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-all duration-200',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:scale-[0.98]',
    variants[variant],
    sizes[size],
    className,
  )
}

interface ButtonLinkProps {
  to: string
  children: ReactNode
  variant?: Variant
  size?: Size
  className?: string
  external?: boolean
  ariaLabel?: string
}

export function ButtonLink({ to, children, variant, size, className, external, ariaLabel }: ButtonLinkProps) {
  const cls = buttonClass(variant, size, className)
  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={cls} aria-label={ariaLabel}>
        {children}
      </a>
    )
  }
  return <Link to={to} className={cls} aria-label={ariaLabel}>{children}</Link>
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-2xl bg-white/5', className)} />
}

/** Compact header band for inner pages — carries the page's single <h1>. */
export function PageHeader({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <header className="relative overflow-hidden border-b border-white/5 pt-28 pb-14 md:pt-36 md:pb-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(212,175,55,0.12),transparent)]" aria-hidden />
      <Container className="relative text-center">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-extrabold text-white md:text-5xl">{title}</h1>
        {lead && <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-400 md:text-lg">{lead}</p>}
      </Container>
    </header>
  )
}
