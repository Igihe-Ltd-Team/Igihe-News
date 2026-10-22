import { ITEMS, type SiteKey } from './registry'
import { validateContentValue } from './validate'


/** `{name}` placeholders in a template value, replaced by the given values. */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole))
}

export interface SiteContentApi {
  /** Text, template, image, link or page: the edited value, or today's default. */
  get(key: SiteKey): string
  /** A template with its {placeholders} filled in. */
  fill(key: SiteKey, values: Record<string, string | number>): string
  /** True when a super admin has saved their own value (the item no longer shows its built-in default). */
  isEdited(key: SiteKey): boolean
}

/**
 * Builds the read API over a set of overrides (key -> stored value). The same object works on the
 * server (components, layouts) and in the browser (through the provider), so a call site reads the
 * same either way. A key that is not in the registry cannot happen at compile time (SiteKey).
 */
export function createContent(overrides: Readonly<Record<string, string>>): SiteContentApi {
  const get = (key: SiteKey): string => overrides[key] ?? ITEMS[key].default
  return {
    get,
    fill: (key, values) => fillTemplate(get(key), values),
    isEdited: key => Object.hasOwn(overrides, key),
  }
}

/** Keeps only overrides that are known keys AND still pass the item's validation. Anything else is ignored, never shown. */
export function sanitizeOverrides(stored: Readonly<Record<string, string>>): Record<string, string> {
  const clean: Record<string, string> = {}
  for (const [key, value] of Object.entries(stored)) {
    const item = (ITEMS as Record<string, (typeof ITEMS)[SiteKey] | undefined>)[key]
    if (!item) continue
    const result = validateContentValue(item, value)
    if (result.ok) clean[key] = result.value
  }
  return clean
}

export const DEFAULT_CONTENT: SiteContentApi = createContent({})
