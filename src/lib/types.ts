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

// Helper type for settings as a flat key-value map
export type SettingsMap = Record<string, string>
