import { z } from 'zod'
import { PAGE_TEXT_LIMITS, lineText, linkTarget, richText } from './text'

// /gutanga-amakuru (send us news): a hero, four contact cards, and a "before you send" checklist.
// The icons and the number of cards are part of the design; the words and links are editable.

export const CARD_ICON_NAMES = ['phone', 'whatsapp', 'email'] as const
export const CHIP_ICON_NAMES = ['text', 'photo', 'video'] as const

// Pages saved before cards and chips could be added or removed have no icon: they get the one their position always had.
const withPositionalIcons = (names: readonly string[], key: string) => (value: unknown) =>
  Array.isArray(value)
    ? value.map((item, i) => {
        const base = typeof item === 'string' ? { label: item } : item
        return base && typeof base === 'object' && !(key in base) ? { ...base, [key]: names[i % names.length] } : base
      })
    : value

const contactCard = z.object({
  icon: z.enum(CARD_ICON_NAMES),
  title: lineText(),
  desc: richText(),
  value: lineText(),
  linkLabel: lineText(60),
  linkHref: linkTarget,
})
const chip = z.object({ icon: z.enum(CHIP_ICON_NAMES), label: lineText(40) })

export const gutangaSchema = z.object({
  hero: z.object({ eyebrow: lineText(), title: richText(300), lead: richText(), leadStrong: richText() }),
  contact: z.object({
    eyebrow: lineText(),
    title: lineText(),
    /** Any number from none to six; each has an icon of its own choice (phone, WhatsApp, email). */
    cards: z.preprocess(withPositionalIcons(CARD_ICON_NAMES, 'icon'), z.array(contactCard).max(6)),
    account: z.object({
      title: lineText(),
      desc: richText(),
      /** The file types shown as small chips (text, photos, videos...). From none to six. */
      chips: z.preprocess(withPositionalIcons(CHIP_ICON_NAMES, 'icon'), z.array(chip).max(6)),
      buttonLabel: lineText(60),
      buttonHref: linkTarget,
    }),
  }),
  check: z.object({
    eyebrow: lineText(),
    title: lineText(),
    intro: richText(),
    steps: z.array(z.object({ title: lineText(), text: richText() })).min(1).max(PAGE_TEXT_LIMITS.maxSections),
    note: richText(),
  }),
})

export type GutangaDoc = z.output<typeof gutangaSchema>

export const GUTANGA_DEFAULT: GutangaDoc = {
  hero: {
    eyebrow: 'INKURU ITANGIRIRA KURI WOWE',
    title: 'Hari amakuru ufite?\nYasangize IGIHE.',
    lead: 'Waba wabonye ikintu kidasanzwe, ufite amakuru ku kibazo kibangamiye abaturage cyangwa hari inkuru wifuza ko dukurikirana?',
    leadStrong: 'IGIHE yiteguye kwakira amakuru yawe!',
  },
  contact: {
    eyebrow: 'TWANDIKIRE',
    title: 'Uko watugezaho amakuru',
    cards: [
      { icon: 'phone', title: 'Duhamagare', desc: 'Tuganirize ku makuru ufite cyangwa ku nkuru wifuza ko dukurikirana.', value: '0788 272 621', linkLabel: 'Hamagara', linkHref: 'tel:+250788272621' },
      { icon: 'whatsapp', title: 'Kuri WhatsApp', desc: 'Twoherereze ubutumwa, amafoto cyangwa amashusho kuri WhatsApp.', value: '0788 272 621', linkLabel: 'Twandikire', linkHref: 'https://wa.me/250788272621' },
      { icon: 'email', title: 'Kuri email', desc: 'Ohereza amakuru yawe, wongereho amafoto cyangwa ibindi bimenyetso.', value: 'editor@igihe.com', linkLabel: 'Ohereza email', linkHref: 'mailto:editor@igihe.com' },
    ],
    account: {
      title: 'Ku rubuga rwacu',
      desc: 'Fungura konti, ujye udusangiza amakuru igihe cyose uyafite.',
      chips: [
        { icon: 'text', label: 'Inyandiko' },
        { icon: 'photo', label: 'Amafoto' },
        { icon: 'video', label: 'Amashusho' },
      ],
      buttonLabel: 'Fungura konti',
      buttonHref: '/register',
    },
  },
  check: {
    eyebrow: 'MBERE YO KOHEREZA',
    title: 'Ni iki wakwitaho?',
    intro: 'Amakuru yuzuye adufasha gukurikirana inkuru.',
    steps: [
      { title: 'Ni iki cyabaye?', text: 'Sobanura ibyabaye n’abo bireba.' },
      { title: 'Byabereye he?', text: 'Garagaza neza aho byabereye.' },
      { title: 'Byabaye ryari?', text: 'Vuga itariki n’igihe byabereye.' },
      { title: 'Kuki ari ingenzi?', text: 'Sobanura impamvu iyi nkuru ikwiye gukurikiranwa.' },
    ],
    note: 'Ufite amafoto, amashusho cyangwa ibindi bimenyetso? {{Ushobora kubyongeraho.}}',
  },
}
