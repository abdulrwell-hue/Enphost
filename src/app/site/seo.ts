import { useEffect } from 'react'

export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.enphost.com').replace(/\/$/, '')
export const SITE_NAME = 'Enphost'
export const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1767950470198-c9cd97f8ed87?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1200&h=630'

type JsonLd = Record<string, unknown>

interface SeoOptions {
  /** Page title without the brand suffix — omit on the home page */
  title?: string
  description: string
  /** Route path, e.g. "/portfolio" */
  path: string
  image?: string
  noindex?: boolean
  /** Structured data blocks rendered as <script type="application/ld+json"> */
  jsonLd?: JsonLd[]
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

const LD_ATTR = 'data-page-ld'

/** Keeps title, description, canonical, Open Graph and JSON-LD in sync with the current page. */
export function useSeo({ title, description, path, image = DEFAULT_OG_IMAGE, noindex, jsonLd }: SeoOptions) {
  const ldKey = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | تصوير عقاري احترافي — صور وفيديو سينمائي للعقارات`
    const url = `${SITE_URL}${path === '/' ? '/' : path}`

    document.title = fullTitle
    setMeta('name', 'description', description)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
    setCanonical(url)

    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', image)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', image)

    document.head.querySelectorAll(`script[${LD_ATTR}]`).forEach(el => el.remove())
    if (ldKey) {
      for (const block of JSON.parse(ldKey) as JsonLd[]) {
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.setAttribute(LD_ATTR, '')
        script.textContent = JSON.stringify(block)
        document.head.appendChild(script)
      }
    }
  }, [title, description, path, image, noindex, ldKey])
}

/** Private screens (dashboard, login) must never land in search results. */
export function useNoIndex(title = 'لوحة التحكم') {
  useEffect(() => {
    document.title = `${title} | ${SITE_NAME}`
    setMeta('name', 'robots', 'noindex, nofollow')
  }, [title])
}

export function breadcrumbLd(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}
