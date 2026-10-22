'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { createContent, DEFAULT_CONTENT, type SiteContentApi } from '@/lib/siteContent/content'

const SiteContentContext = createContext<SiteContentApi>(DEFAULT_CONTENT)

/**
 * Makes the edited site content available to every client component below it. Mounted once in the
 * public layout with the (already validated) overrides read on the server. Outside a provider the
 * hook returns the built-in defaults, so a component works the same anywhere.
 */
export function SiteContentProvider({ overrides, children }: { overrides: Record<string, string>; children: ReactNode }) {
  const value = useMemo(() => createContent(overrides), [overrides])
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}

export function useSiteContent(): SiteContentApi {
  return useContext(SiteContentContext)
}
