// ── Contract helpers ─────────────────────────────────────────────────────────
// The contract is the final document the admin fills and sends to the client.
// Its service rows come from the catalog (see ./catalog) and print as
// «الخدمة | المواصفات/الكمية | مدة التسليم | السعر» in the template.

import { serviceTotals, type ServiceItem, type Totals } from './catalog'

export type ContractStatus = 'draft' | 'sent' | 'signed' | 'cancelled'

export type PortfolioUsage = 'allowed' | 'not_allowed' | 'on_approval'

export const PORTFOLIO_USAGE_OPTIONS: { value: PortfolioUsage; label: string }[] = [
  { value: 'allowed',     label: 'مسموح بعد النشر العام' },
  { value: 'not_allowed', label: 'غير مسموح' },
  { value: 'on_approval', label: 'مسموح بعد موافقة كتابية لكل حالة' },
]

export const portfolioUsageLabel = (v: string) =>
  PORTFOLIO_USAGE_OPTIONS.find(o => o.value === v)?.label ?? ''

/** بند من بنود العقد كما طُبع عليه — لقطة محفوظة داخل صف العقد */
export interface ContractClauseSnapshot {
  slug: string | null
  title: string
  body: string
}

export interface ContractTotals extends Totals {
  depositAmount: number
  balanceAmount: number
}

export function contractTotals(
  items: ServiceItem[],
  discountPct: number,
  vatEnabled: boolean,
  vatPct: number,
  depositPct: number,
): ContractTotals {
  const totals = serviceTotals(items, discountPct, vatEnabled, vatPct)
  const depositAmount = Math.round(totals.total * (Math.min(100, Math.max(0, depositPct)) / 100))
  return { ...totals, depositAmount, balanceAmount: totals.total - depositAmount }
}
