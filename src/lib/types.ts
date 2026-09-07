export interface PortfolioItem {
  id: string
  created_at: string
  title: string | null
  storage_path: string
  public_url: string
  sort_order: number
  is_visible: boolean
  is_featured: boolean
  property_type: string | null
}

export interface Video {
  id: string
  created_at: string
  title: string
  storage_path: string
  public_url: string
  thumbnail_url: string | null
  is_visible: boolean
  sort_order: number
}

export interface Package {
  id: string
  created_at: string
  name: string
  price: number
  features: string[]
  is_popular: boolean
  is_active: boolean
  sort_order: number
}

export interface TermsCondition {
  id: string
  created_at: string
  text: string
  sort_order: number
  is_active: boolean
}

export interface SiteSetting {
  id: string
  key: string
  value: string
  updated_at: string
}

export interface ContentBlock {
  id: string
  section: string
  key: string
  value: string
  updated_at: string
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected'

export interface Quotation {
  id: string
  created_at: string
  updated_at: string
  quote_number: string
  status: QuotationStatus
  client_name: string
  client_phone: string | null
  client_company: string | null
  project_name: string | null
  project_location: string | null
  valid_until: string | null
  notes: string | null
  config: import('./pricing').QuoteInput
  items: import('./pricing').LineItem[]
  terms: string[]
  discount_pct: number
  vat_enabled: boolean
  vat_pct: number
  subtotal: number
  discount_amount: number
  vat_amount: number
  total: number
}

// Helper type for settings as a flat key-value map
export type SettingsMap = Record<string, string>

// ── Contracts ────────────────────────────────────────────────────────────────

export interface ContractClause {
  id: string
  created_at: string
  slug: string | null
  title: string
  body: string
  sort_order: number
  is_active: boolean
}

export interface Contract {
  id: string
  created_at: string
  updated_at: string

  contract_number: string
  order_number: string | null
  status: import('./contracts').ContractStatus

  sign_date: string | null
  sign_city: string
  duration_from: string | null
  duration_to: string | null

  provider_legal_name: string
  provider_registration: string | null
  provider_address: string | null
  provider_rep_name: string | null
  provider_rep_title: string | null
  provider_phone: string | null
  provider_email: string | null

  client_name: string
  client_id_number: string | null
  client_address: string | null
  client_rep_name: string | null
  client_rep_title: string | null
  client_phone: string | null
  client_email: string | null

  property_name: string | null
  property_location: string | null
  shoot_date: string | null
  shoot_time: string | null
  site_contact_name: string | null
  site_contact_phone: string | null

  items: import('./contracts').ContractItem[]

  discount_pct: number
  discount_amount: number
  subtotal: number
  vat_enabled: boolean
  vat_pct: number
  vat_amount: number
  total: number
  deposit_pct: number
  deposit_amount: number
  balance_amount: number
  balance_due_on: string | null

  revision_rounds: number
  delivery_format: string
  platforms: string | null
  raw_files_included: boolean
  raw_files_price: number
  travel_fee_included: boolean
  travel_fee: number
  reschedule_terms: string | null

  portfolio_usage: import('./contracts').PortfolioUsage
  notes: string | null

  clauses: import('./contracts').ContractClauseSnapshot[]
  quotation_id: string | null
}
