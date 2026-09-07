// ── Contract helpers ─────────────────────────────────────────────────────────
// The contract is the final document the admin fills and sends to the client.
// Its service table is flatter than a quotation's: one price per row, no qty —
// matching «الخدمة | المواصفات/الكمية | مدة التسليم | السعر» in the template.

import { formatSAR, type LineItem } from './pricing'

export type ContractStatus = 'draft' | 'sent' | 'signed' | 'cancelled'

export type PortfolioUsage = 'allowed' | 'not_allowed' | 'on_approval'

export const PORTFOLIO_USAGE_OPTIONS: { value: PortfolioUsage; label: string }[] = [
  { value: 'allowed',     label: 'مسموح بعد النشر العام' },
  { value: 'not_allowed', label: 'غير مسموح' },
  { value: 'on_approval', label: 'مسموح بعد موافقة كتابية لكل حالة' },
]

export const portfolioUsageLabel = (v: string) =>
  PORTFOLIO_USAGE_OPTIONS.find(o => o.value === v)?.label ?? ''

export interface ContractItem {
  id: string
  /** الخدمة */
  service: string
  /** المواصفات / الكمية */
  spec: string
  /** مدة التسليم */
  delivery: string
  /** السعر (ر.س) */
  price: number
}

/** بند من بنود العقد كما طُبع عليه — لقطة محفوظة داخل صف العقد */
export interface ContractClauseSnapshot {
  slug: string | null
  title: string
  body: string
}

let seq = 0
const nextId = () => `ci-${Date.now().toString(36)}-${seq++}`

export function newContractItem(): ContractItem {
  return { id: nextId(), service: '', spec: '', delivery: '', price: 0 }
}

/**
 * يحوّل بنود عرض السعر إلى صفوف جدول الخدمات في العقد.
 * الكمية تُدمج في خانة المواصفات لأن جدول العقد يعرض سعراً واحداً للبند.
 */
export function itemsFromQuotation(lineItems: LineItem[]): ContractItem[] {
  return lineItems.map(li => ({
    id: nextId(),
    service: li.label,
    spec: li.qty > 1
      ? [li.description, `الكمية: ${li.qty} × ${formatSAR(li.unitPrice)} ر.س`].filter(Boolean).join(' — ')
      : li.description,
    delivery: '',
    price: (Number(li.qty) || 0) * (Number(li.unitPrice) || 0),
  }))
}

export interface ContractTotals {
  subtotal: number
  discountAmount: number
  afterDiscount: number
  vatAmount: number
  total: number
  depositAmount: number
  balanceAmount: number
}

export function contractTotals(
  items: ContractItem[],
  discountPct: number,
  vatEnabled: boolean,
  vatPct: number,
  depositPct: number,
): ContractTotals {
  const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0), 0)
  const discountAmount = Math.round(subtotal * (Math.max(0, discountPct) / 100))
  const afterDiscount = subtotal - discountAmount
  const vatAmount = vatEnabled ? Math.round(afterDiscount * (vatPct / 100)) : 0
  const total = afterDiscount + vatAmount
  const depositAmount = Math.round(total * (Math.min(100, Math.max(0, depositPct)) / 100))
  return {
    subtotal,
    discountAmount,
    afterDiscount,
    vatAmount,
    total,
    depositAmount,
    balanceAmount: total - depositAmount,
  }
}
