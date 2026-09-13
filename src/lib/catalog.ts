// ── Catalog → service rows ───────────────────────────────────────────────────
// Packages and add-ons are the single source of what we sell. Quotations and
// contracts pick from them; each pick becomes a ServiceItem snapshot stored in
// the document's `items`, so later catalog edits never rewrite old documents.

import type { Package } from './types'

export type AddonPricing = 'unit' | 'percent'

export interface Addon {
  id: string
  created_at: string
  name: string
  description: string | null
  /** unit = العدد × السعر، percent = نسبة من قيمة الباقة والإضافات */
  pricing_type: AddonPricing
  /** وحدة العدّ — صورة، م²… فارغ = خدمة */
  unit_label: string | null
  /** سعر الوحدة، أو النسبة % للنوع percent */
  price: number
  price_max: number | null
  delivery: string | null
  is_active: boolean
  sort_order: number
}

export type ServiceKind = 'package' | 'addon' | 'custom'

export interface ServiceItem {
  id: string
  kind: ServiceKind
  /** معرّف الباقة أو الإضافة في الكتالوج */
  refId: string | null
  /** الخدمة */
  name: string
  /** المواصفات — للباقة: ما تشمله */
  spec: string
  /** مدة التسليم */
  delivery: string
  pricing: AddonPricing
  unitLabel: string
  qty: number
  /** سعر الوحدة، أو النسبة % للنوع percent */
  price: number
  /** النطاق المقترح من الكتالوج — للتنبيه فقط */
  priceMin: number | null
  priceMax: number | null
}

let seq = 0
const nextId = () => `si-${Date.now().toString(36)}-${seq++}`

export const formatSAR = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n || 0))

/** «450 – 650» أو «450» */
export function formatRange(min: number, max: number | null, suffix = '') {
  const lo = `${formatSAR(min)}${suffix}`
  return max != null && max !== min ? `${lo} – ${formatSAR(max)}${suffix}` : lo
}

export function itemFromPackage(pkg: Package): ServiceItem {
  return {
    id: nextId(),
    kind: 'package',
    refId: pkg.id,
    name: pkg.name,
    spec: pkg.features.filter(Boolean).join(' • '),
    delivery: pkg.delivery ?? '',
    pricing: 'unit',
    unitLabel: '',
    qty: 1,
    price: Number(pkg.price) || 0,
    priceMin: Number(pkg.price) || 0,
    priceMax: pkg.price_max,
  }
}

export function itemFromAddon(addon: Addon): ServiceItem {
  return {
    id: nextId(),
    kind: 'addon',
    refId: addon.id,
    name: addon.name,
    spec: addon.description ?? '',
    delivery: addon.delivery ?? '',
    pricing: addon.pricing_type,
    unitLabel: addon.unit_label ?? '',
    qty: 1,
    price: Number(addon.price) || 0,
    priceMin: Number(addon.price) || 0,
    priceMax: addon.price_max,
  }
}

export function customItem(): ServiceItem {
  return {
    id: nextId(), kind: 'custom', refId: null, name: '', spec: '', delivery: '',
    pricing: 'unit', unitLabel: '', qty: 1, price: 0, priceMin: null, priceMax: null,
  }
}

/** نسخة ببنود جديدة المعرّفات — عند تحويل عرض سعر إلى عقد */
export const cloneItems = (items: ServiceItem[]) => items.map(i => ({ ...i, id: nextId() }))

export const packageItemOf = (items: ServiceItem[]) => items.find(i => i.kind === 'package') ?? null

/** مجموع البنود بالعدد — أساس حساب البنود النسبية */
export function servicesBase(items: ServiceItem[]) {
  return items
    .filter(i => i.pricing !== 'percent')
    .reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0)
}

export function lineAmount(item: ServiceItem, base: number) {
  return item.pricing === 'percent'
    ? Math.round(base * ((Number(item.price) || 0) / 100))
    : (Number(item.qty) || 0) * (Number(item.price) || 0)
}

/** سطر المواصفات كما يُطبع — يضيف الكمية أو النسبة عند الحاجة */
export function specLine(item: ServiceItem) {
  const extra =
    item.pricing === 'percent'
      ? `${item.price}% من قيمة الخدمات`
      : item.qty !== 1 || item.unitLabel
        ? `الكمية: ${item.qty}${item.unitLabel ? ` ${item.unitLabel}` : ''} × ${formatSAR(item.price)} ر.س`
        : ''
  return [item.spec, extra].filter(Boolean).join(' — ')
}

export interface Totals {
  subtotal: number
  discountAmount: number
  afterDiscount: number
  vatAmount: number
  total: number
}

export function serviceTotals(
  items: ServiceItem[],
  discountPct: number,
  vatEnabled: boolean,
  vatPct: number,
): Totals {
  const base = servicesBase(items)
  const subtotal = items.reduce((s, i) => s + lineAmount(i, base), 0)
  const discountAmount = Math.round(subtotal * (Math.max(0, discountPct) / 100))
  const afterDiscount = subtotal - discountAmount
  const vatAmount = vatEnabled ? Math.round(afterDiscount * (vatPct / 100)) : 0
  return { subtotal, discountAmount, afterDiscount, vatAmount, total: afterDiscount + vatAmount }
}

/**
 * يقرأ بنود أي مستند محفوظ — الشكل الحالي، أو بنود عروض الأسعار القديمة
 * (label / description / qty / unitPrice)، أو بنود العقود القديمة
 * (service / spec / delivery / price).
 */
export function normalizeItems(raw: unknown): ServiceItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((r: Record<string, unknown>) => {
    if (r.kind) return { ...customItem(), ...(r as Partial<ServiceItem>) } as ServiceItem
    if ('service' in r) {
      return {
        ...customItem(),
        name: String(r.service ?? ''),
        spec: String(r.spec ?? ''),
        delivery: String(r.delivery ?? ''),
        price: Number(r.price) || 0,
      }
    }
    return {
      ...customItem(),
      name: String(r.label ?? ''),
      spec: String(r.description ?? ''),
      qty: Number(r.qty) || 0,
      price: Number(r.unitPrice) || 0,
    }
  })
}
