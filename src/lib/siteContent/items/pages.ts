import type { ContentItems } from '../types'
import { defaultPageJson } from '../pageDocs'

// The three long pages. Each one is edited as a whole, in the shape of its design (see lib/siteContent/pageDocs).
export const PAGES = {
  'pages.ubwanditsi': {
    group: 'Long pages',
    label: 'Reader comment guidelines (/ubwanditsi)',
    kind: 'page',
    page: 'ubwanditsi',
    default: defaultPageJson('ubwanditsi'),
    where: 'The "Amahame agenga ibitekerezo by’abasomyi" page: the rules for reader comments.',
  },
  'pages.gutanga_amakuru': {
    group: 'Long pages',
    label: 'Send us news (/gutanga-amakuru)',
    kind: 'page',
    page: 'gutanga_amakuru',
    default: defaultPageJson('gutanga_amakuru'),
    where: 'The "Hari amakuru ufite? Yasangize IGIHE" page: how readers can send IGIHE a news tip.',
  },
  'pages.policy': {
    group: 'Long pages',
    label: 'Privacy policy (/policy)',
    kind: 'page',
    page: 'policy',
    default: defaultPageJson('policy'),
    where: 'The "Ibijyanye n’amakuru bwite y’abasomyi" page: the privacy policy.',
  },
} as const satisfies ContentItems
