// ── Quotation pricing engine ─────────────────────────────────────────────────
// Real-estate photography is priced per PROJECT, not per unit × count:
// mobilisation (travel + setup) happens once, and similar units only need a
// sample shoot. This module turns a project brief into a suggested price range
// plus a seeded list of line items the admin can edit freely.

export type DeliverableTier = 'basic' | 'standard' | 'photo_video'

export interface TierMeta {
  key: DeliverableTier
  label: string
  deliverable: string
  defaultPhotos: number
}

export const TIERS: TierMeta[] = [
  {
    key: 'basic',
    label: 'توثيق سريع',
    deliverable: '4–6 صور للوحدة، معالجة قياسية',
    defaultPhotos: 5,
  },
  {
    key: 'standard',
    label: 'تصوير احترافي',
    deliverable: '8–12 صورة للوحدة، معالجة متقدمة',
    defaultPhotos: 10,
  },
  {
    key: 'photo_video',
    label: 'صور + فيديو',
    deliverable: 'صور احترافية + فيديو شامل للمشروع',
    defaultPhotos: 12,
  },
]

export interface AddOnDef {
  key: string
  label: string
  /** fixed = مبلغ ثابت، per_unit = لكل وحدة، percent = نسبة من المجموع */
  type: 'fixed' | 'per_unit' | 'percent'
  amount: number
}

export interface PricingConfig {
  /** السعر الأساسي للوحدة الواحدة قبل معامل الحجم */
  tierRates: Record<DeliverableTier, number>
  /** معامل الحجم — تُطبّق آخر شريحة يكون فيها العدد ≥ min */
  volumeTiers: { min: number; factor: number }[]
  /** نسبة الوحدات النموذجية عند تشابه الشقق */
  similarSampleRatio: number
  similarSampleMin: number
  similarSampleMax: number
  /** تصوير المرافق والواجهات — يُضاف عند التشابه فقط */
  commonAreasFee: number
  /** التجهيز والانتقال — يوم واحد */
  mobilizationBase: number
  /** كل يوم تصوير إضافي */
  extraDayRate: number
  /** عدد الوحدات المنجزة في اليوم لكل مستوى */
  unitsPerDay: Record<DeliverableTier, number>
  addOns: AddOnDef[]
  /** حدود النطاق المقترح حول السعر الأساسي */
  rangeLow: number
  rangeHigh: number
  vatPct: number
  /** أقل سعر تجاري معقول للوحدة — تحته يظهر تنبيه */
  minCommercialUnitRate: number
}

export const DEFAULT_PRICING: PricingConfig = {
  tierRates: { basic: 300, standard: 550, photo_video: 700 },
  volumeTiers: [
    { min: 1, factor: 1.5 },
    { min: 2, factor: 1.25 },
    { min: 5, factor: 1.1 },
    { min: 10, factor: 0.95 },
    { min: 20, factor: 0.85 },
    { min: 50, factor: 0.75 },
  ],
  similarSampleRatio: 0.3,
  similarSampleMin: 3,
  similarSampleMax: 8,
  commonAreasFee: 1800,
  mobilizationBase: 900,
  extraDayRate: 450,
  unitsPerDay: { basic: 12, standard: 8, photo_video: 5 },
  addOns: [
    { key: 'drone', label: 'تصوير بالدرون', type: 'fixed', amount: 1500 },
    { key: 'twilight', label: 'تصوير الغروب / الليلي', type: 'fixed', amount: 600 },
    { key: 'floorplan', label: 'مخطط أرضي للوحدة', type: 'per_unit', amount: 120 },
    { key: 'virtual_tour', label: 'جولة افتراضية 360°', type: 'per_unit', amount: 250 },
    { key: 'extra_revision', label: 'جولة تعديلات إضافية', type: 'fixed', amount: 250 },
    { key: 'rush', label: 'تسليم مستعجل (48 ساعة)', type: 'percent', amount: 20 },
  ],
  rangeLow: 0.95,
  rangeHigh: 1.25,
  vatPct: 15,
  minCommercialUnitRate: 350,
}

/** يدمج إعدادات محفوظة ناقصة مع الإعدادات الافتراضية */
export function mergePricing(saved: unknown): PricingConfig {
  if (!saved || typeof saved !== 'object') return DEFAULT_PRICING
  const s = saved as Partial<PricingConfig>
  return {
    ...DEFAULT_PRICING,
    ...s,
    tierRates: { ...DEFAULT_PRICING.tierRates, ...(s.tierRates ?? {}) },
    unitsPerDay: { ...DEFAULT_PRICING.unitsPerDay, ...(s.unitsPerDay ?? {}) },
    volumeTiers: s.volumeTiers?.length ? s.volumeTiers : DEFAULT_PRICING.volumeTiers,
    addOns: s.addOns?.length ? s.addOns : DEFAULT_PRICING.addOns,
  }
}

export interface QuoteInput {
  units: number
  /** الشقق متشابهة → يكفي تصوير نماذج + المرافق والواجهات */
  similar: boolean
  tier: DeliverableTier
  photosPerUnit: number
  addOns: string[]
  /** تجاوز عدد أيام التصوير المحسوب تلقائياً */
  daysOverride: number | null
}

export const DEFAULT_INPUT: QuoteInput = {
  units: 1,
  similar: false,
  tier: 'standard',
  photosPerUnit: 10,
  addOns: [],
  daysOverride: null,
}

export interface LineItem {
  id: string
  label: string
  description: string
  qty: number
  unitPrice: number
}

export interface QuoteEstimate {
  billableUnits: number
  volumeFactor: number
  unitPrice: number
  days: number
  base: number
  rangeLow: number
  rangeHigh: number
  /** السعر الفعلي لكل وحدة في المشروع (شامل التجهيز والإضافات) */
  effectiveUnitRate: number
  /** السعر الفعلي أقل من الحد التجاري المعقول */
  underCommercialRate: boolean
  items: LineItem[]
}

let seq = 0
const nextId = () => `li-${Date.now().toString(36)}-${seq++}`

export function volumeFactorFor(units: number, config: PricingConfig): number {
  const tiers = [...config.volumeTiers].sort((a, b) => a.min - b.min)
  let factor = tiers[0]?.factor ?? 1
  for (const t of tiers) if (units >= t.min) factor = t.factor
  return factor
}

export function billableUnitsFor(input: QuoteInput, config: PricingConfig): number {
  const units = Math.max(1, input.units)
  if (!input.similar || units <= 1) return units
  const sample = Math.ceil(units * config.similarSampleRatio)
  return Math.min(
    Math.max(sample, config.similarSampleMin),
    Math.min(config.similarSampleMax, units),
  )
}

const round50 = (n: number) => Math.round(n / 50) * 50

/** يبني بنود العرض والسعر المقترح من بيانات المشروع */
export function estimate(input: QuoteInput, config: PricingConfig): QuoteEstimate {
  const units = Math.max(1, input.units)
  const billableUnits = billableUnitsFor(input, config)
  const volumeFactor = volumeFactorFor(billableUnits, config)
  const tier = TIERS.find(t => t.key === input.tier) ?? TIERS[1]
  const unitPrice = Math.round(config.tierRates[input.tier] * volumeFactor)

  const perDay = config.unitsPerDay[input.tier] || 8
  const days = input.daysOverride ?? Math.max(1, Math.ceil(billableUnits / perDay))

  const sampleShoot = input.similar && units > 1
  const items: LineItem[] = []

  items.push({
    id: nextId(),
    label: sampleShoot ? 'تصوير الوحدات النموذجية' : 'تصوير الوحدات',
    description: sampleShoot
      ? `${billableUnits} وحدة نموذجية من أصل ${units} — ${input.photosPerUnit} صورة للوحدة`
      : `${input.photosPerUnit} صورة للوحدة — ${tier.deliverable}`,
    qty: billableUnits,
    unitPrice,
  })

  if (sampleShoot && config.commonAreasFee > 0) {
    items.push({
      id: nextId(),
      label: 'تصوير المرافق والواجهات',
      description: 'المداخل، المواقف، الأسطح، والواجهات الخارجية للمشروع',
      qty: 1,
      unitPrice: config.commonAreasFee,
    })
  }

  if (config.mobilizationBase > 0) {
    items.push({
      id: nextId(),
      label: 'التجهيز والانتقال',
      description: days > 1
        ? `${days} أيام تصوير — التجهيز والانتقال يُحتسب مرة واحدة للمشروع`
        : 'يوم تصوير واحد — التجهيز والانتقال',
      qty: 1,
      unitPrice: config.mobilizationBase + Math.max(0, days - 1) * config.extraDayRate,
    })
  }

  // الإضافات الثابتة وحسب الوحدة
  for (const key of input.addOns) {
    const def = config.addOns.find(a => a.key === key)
    if (!def || def.type === 'percent') continue
    items.push({
      id: nextId(),
      label: def.label,
      description: def.type === 'per_unit' ? `لكل وحدة — ${billableUnits} وحدة` : 'للمشروع كاملاً',
      qty: def.type === 'per_unit' ? billableUnits : 1,
      unitPrice: def.amount,
    })
  }

  // الرسوم النسبية تُحسب على ما سبق
  const beforePercent = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  for (const key of input.addOns) {
    const def = config.addOns.find(a => a.key === key)
    if (!def || def.type !== 'percent') continue
    items.push({
      id: nextId(),
      label: def.label,
      description: `${def.amount}% من قيمة الخدمات`,
      qty: 1,
      unitPrice: Math.round(beforePercent * (def.amount / 100)),
    })
  }

  const base = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const effectiveUnitRate = base / units

  return {
    billableUnits,
    volumeFactor,
    unitPrice,
    days,
    base,
    rangeLow: round50(base * config.rangeLow),
    rangeHigh: round50(base * config.rangeHigh),
    effectiveUnitRate,
    underCommercialRate: units > 1 && effectiveUnitRate < config.minCommercialUnitRate,
    items,
  }
}

export interface Totals {
  subtotal: number
  discountAmount: number
  afterDiscount: number
  vatAmount: number
  total: number
}

export function totalsFor(
  items: LineItem[],
  discountPct: number,
  vatEnabled: boolean,
  vatPct: number,
): Totals {
  const subtotal = items.reduce(
    (s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
    0,
  )
  const discountAmount = Math.round(subtotal * (Math.max(0, discountPct) / 100))
  const afterDiscount = subtotal - discountAmount
  const vatAmount = vatEnabled ? Math.round(afterDiscount * (vatPct / 100)) : 0
  return { subtotal, discountAmount, afterDiscount, vatAmount, total: afterDiscount + vatAmount }
}

export const formatSAR = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n || 0))

export function newLineItem(): LineItem {
  return { id: nextId(), label: '', description: '', qty: 1, unitPrice: 0 }
}
