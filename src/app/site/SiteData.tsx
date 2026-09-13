import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import type { Package, PortfolioItem, Video, SettingsMap, TermsCondition } from '../../lib/types'
import type { Addon } from '../../lib/catalog'

// ── Defaults shown until the dashboard content arrives ──────────────────────
const DEFAULT_WHATSAPP = '966599991078'
const DEFAULT_INSTAGRAM = 'Enpho_st'

export const DEFAULT_WHY_US = [
  'خبرة في إبراز جمال المساحات المعمارية',
  'فهم عميق لزوايا التصوير العقاري',
  'سرعة في التسليم',
  'جودة احترافية عالية',
  'تصوير يساعد على البيع والتسويق',
  'اهتمام بالتفاصيل الصغيرة',
]

export const DEFAULT_STEPS = [
  'تواصل معنا وحدد احتياجك',
  'معاينة العقار أو معرفة التفاصيل',
  'تحديد موعد التصوير',
  'تنفيذ الجلسة باحترافية',
  'تسليم الصور والفيديو خلال الوقت المتفق',
]

// ── Tiny query cache — navigating between pages never refetches or flashes ──
const cache = new Map<string, Promise<unknown>>()

function cached<T>(key: string, load: () => PromiseLike<T>): Promise<T> {
  if (!cache.has(key)) cache.set(key, Promise.resolve(load()))
  return cache.get(key) as Promise<T>
}

const loaders = {
  packages: () =>
    supabase.from('packages').select('*').eq('is_active', true).order('sort_order')
      .then(r => (r.data ?? []) as Package[]),
  addons: () =>
    supabase.from('addons').select('*').eq('is_active', true).order('sort_order')
      .then(r => (r.data ?? []) as Addon[]),
  terms: () =>
    supabase.from('terms_conditions').select('*').eq('is_active', true).order('sort_order')
      .then(r => (r.data ?? []) as TermsCondition[]),
  portfolio: () =>
    supabase.from('portfolio_items').select('*').eq('is_visible', true).order('sort_order')
      .then(r => (r.data ?? []) as PortfolioItem[]),
  videos: () =>
    supabase.from('videos').select('*').eq('is_visible', true).order('sort_order')
      .then(r => (r.data ?? []) as Video[]),
}

type Loaders = typeof loaders
type LoaderData<K extends keyof Loaders> = Awaited<ReturnType<Loaders[K]>>

const settled = new Map<string, unknown>()

export function useTable<K extends keyof Loaders>(key: K) {
  const [data, setData] = useState<LoaderData<K> | undefined>(() => settled.get(key) as LoaderData<K> | undefined)

  useEffect(() => {
    let alive = true
    cached(key, loaders[key]).then(rows => {
      settled.set(key, rows)
      if (alive) setData(rows as LoaderData<K>)
    })
    return () => { alive = false }
  }, [key])

  return { data: (data ?? []) as LoaderData<K>, loading: data === undefined }
}

// ── Settings + editable content, shared by every page ──────────────────────
interface SiteData {
  ready: boolean
  businessName: string
  email: string
  phoneDisplay: string
  phoneHref: string
  /** +9665… for structured data */
  phoneIntl: string
  whatsappUrl: (message?: string) => string
  instagramUrl: string
  instagramHandle: string
  /** Content block from the dashboard, with a fallback */
  text: (section: string, key: string, fallback: string) => string
  list: (section: string, fallback: string[]) => string[]
}

const SiteDataContext = createContext<SiteData | null>(null)

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsMap>({})
  const [blocks, setBlocks] = useState<Record<string, string>>({})
  const [lists, setLists] = useState<Record<string, string[]>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('site_settings').select('key, value'),
      supabase.from('content_blocks').select('section, key, value'),
    ]).then(([settingsRes, contentRes]) => {
      const map: SettingsMap = {}
      settingsRes.data?.forEach(s => { map[s.key] = s.value })
      setSettings(map)

      const b: Record<string, string> = {}
      const l: Record<string, string[]> = {}
      contentRes.data?.forEach(row => {
        if (row.key === 'items' || row.key === 'steps') {
          try { l[row.section] = JSON.parse(row.value) } catch { /* ignore malformed list */ }
        } else {
          b[`${row.section}__${row.key}`] = row.value
        }
      })
      setBlocks(b)
      setLists(l)
      setReady(true)
    })
  }, [])

  const whatsapp = settings.whatsapp_number || DEFAULT_WHATSAPP
  const instagramHandle = settings.instagram_handle || DEFAULT_INSTAGRAM
  const localPhone = whatsapp.startsWith('966') ? `0${whatsapp.slice(3)}` : whatsapp

  const value: SiteData = {
    ready,
    businessName: settings.business_name || 'Enphost',
    email: settings.email || 'info@photographer.com',
    phoneDisplay: localPhone,
    phoneHref: `tel:+${whatsapp}`,
    phoneIntl: `+${whatsapp}`,
    whatsappUrl: message =>
      `https://wa.me/${whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ''}`,
    instagramUrl: `https://www.instagram.com/${instagramHandle}`,
    instagramHandle,
    text: (section, key, fallback) => blocks[`${section}__${key}`] || fallback,
    list: (section, fallback) => (lists[section]?.length ? lists[section] : fallback),
  }

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>
}

export function useSite() {
  const ctx = useContext(SiteDataContext)
  if (!ctx) throw new Error('useSite must be used inside <SiteDataProvider>')
  return ctx
}
