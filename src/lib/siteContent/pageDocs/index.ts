import type { z } from 'zod'
import { gutangaSchema, GUTANGA_DEFAULT } from './gutanga'
import { policySchema, POLICY_DEFAULT } from './policy'
import { ubwanditsiSchema, UBWANDITSI_DEFAULT } from './ubwanditsi'
import { parseDoc } from './text'

// The long pages a super admin can edit, each with the exact shape of its design.

export const PAGE_IDS = ['ubwanditsi', 'policy', 'gutanga_amakuru'] as const
export type PageId = (typeof PAGE_IDS)[number]

export const PAGE_SCHEMAS = {
  ubwanditsi: ubwanditsiSchema,
  policy: policySchema,
  gutanga_amakuru: gutangaSchema,
} as const satisfies Record<PageId, z.ZodTypeAny>

export const PAGE_DEFAULTS = {
  ubwanditsi: UBWANDITSI_DEFAULT,
  policy: POLICY_DEFAULT,
  gutanga_amakuru: GUTANGA_DEFAULT,
} as const

export type PageDocs = { [K in PageId]: z.infer<(typeof PAGE_SCHEMAS)[K]> }

export const isPageId = (value: unknown): value is PageId => typeof value === 'string' && (PAGE_IDS as readonly string[]).includes(value)

/** Parses a stored page document for the given page. */
export function parsePageDoc<K extends PageId>(page: K, raw: string): { ok: true; value: PageDocs[K] } | { ok: false; error: string } {
  return parseDoc(PAGE_SCHEMAS[page] as z.ZodTypeAny, raw) as { ok: true; value: PageDocs[K] } | { ok: false; error: string }
}

export const defaultPageJson = (page: PageId): string => JSON.stringify(PAGE_DEFAULTS[page])
