// The shape of one editable piece of the public site. Every item lives in code with its CURRENT
// text, image or link as the default, so the site looks exactly as before until a super admin
// changes something in the dashboard. Only the overrides are stored in the database.

import type { PageId } from './pageDocs'

export const CONTENT_KINDS = ['text', 'textarea', 'template', 'image', 'link', 'color', 'page'] as const
export type ContentKind = (typeof CONTENT_KINDS)[number]

export interface ContentItemDef {
  /** Where it appears in the dashboard list: "Home", "Header", "Article page"... */
  group: string
  /** Short, human name of the item. */
  label: string
  kind: ContentKind
  /** What the site shows today / when nothing has been edited. Text, an image path, a link, or (page) the page's starting content as JSON. */
  default: string
  /** page only: which long page this is (decides its shape and design). */
  page?: PageId
  /** One sentence on where visitors see it. */
  where?: string
  /** text/textarea/template: longest allowed value. */
  maxLength?: number
  /** template only: the {placeholders} the value may contain, filled in at render time. */
  placeholders?: readonly string[]
  /** image/link only: the item may be empty (default ""), meaning "not shown" — e.g. an optional sponsor banner. */
  optional?: boolean
  /** image only: alt text used where the image has none of its own. */
  help?: string
}

export type ContentItems = Record<string, ContentItemDef>

export const DEFAULT_MAX_LENGTH = { text: 120, textarea: 600, template: 160 } as const
