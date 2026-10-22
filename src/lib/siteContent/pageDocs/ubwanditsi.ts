import { z } from 'zod'
import { PAGE_TEXT_LIMITS, lineText, richText, textList } from './text'

// /ubwanditsi (reader comment guidelines): a hero, then numbered sections made of the blocks below.

export const ubwanditsiBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: richText() }),
  z.object({ type: z.literal('bullets'), items: textList() }),
  z.object({ type: z.literal('note'), text: richText() }),
  z.object({ type: z.literal('reasons'), items: textList() }),
  z.object({ type: z.literal('callout'), text: richText() }),
])

export const ubwanditsiSchema = z.object({
  hero: z.object({ eyebrow: lineText(), title: richText(300), lead: richText() }),
  sections: z
    .array(z.object({ title: lineText(), tocLabel: lineText(60), blocks: z.array(ubwanditsiBlockSchema).min(1, 'A section needs at least one block').max(PAGE_TEXT_LIMITS.maxBlocks) }))
    .min(1, 'The page needs at least one section')
    .max(PAGE_TEXT_LIMITS.maxSections),
})

export type UbwanditsiDoc = z.infer<typeof ubwanditsiSchema>
export type UbwanditsiBlock = z.infer<typeof ubwanditsiBlockSchema>

export const UBWANDITSI_DEFAULT: UbwanditsiDoc = {
  hero: {
    eyebrow: 'IBITEKEREZO BYUBAKA. IBIGANIRO MU BWUBAHANE.',
    title: 'Amahame agenga\nibitekerezo by’abasomyi',
    lead: 'IGIHE ishishikariza abantu gutanga ibitekerezo byubaka ku mbuga zayo. Kugenzura ibitekerezo bigamije kurinda abakoresha izi mbuga, kubahiriza amahame y’ubwanditsi no gutuma ibiganiro bikorwa mu bwubahane, mu buryo bwemewe n’amategeko kandi biri mu nyungu rusange za rubanda.',
  },
  sections: [
    {
      title: 'Icyo kugenzura ibitekerezo bisobanuye muri IGIHE',
      tocLabel: 'Ibisobanuro',
      blocks: [
        {
          type: 'paragraph',
          text: 'Kugenzura ibitekerezo ni ugusuzuma ibitekerezo bitangwa n’abakoresha imbuga za IGIHE, kugira ngo harebwe niba byubahiriza amahame y’ubwanditsi ya IGIHE, amahame agenga umwuga w’itangazamakuru n’andi mategeko yose. {{Ibitekerezo binyuranyije n’aya mahame bishobora gukurwaho.}}',
        },
      ],
    },
    {
      title: 'Uko IGIHE igenzura ibitekerezo',
      tocLabel: 'Uko bigenzurwa',
      blocks: [
        { type: 'bullets', items: ['Ibitekerezo byose bitangazwa ku mbuga za IGIHE {{bisuzumwa bihoraho.}}'] },
        { type: 'note', text: 'Ibitekerezo bigenzurwa {{nibura buri minota 15.}}' },
        {
          type: 'bullets',
          items: [
            'Buri munsi hashyirwaho umuntu ushinzwe kugenzura no gukosora inyandiko, {{‘Copy Editor’}}, ugenzura ibitekerezo by’abasomyi.',
            'Uwo muntu asuzuma niba ibitekerezo byubahiriza amategeko n’amabwiriza ya IGIHE, ndetse agakuraho ibinyuranyije na yo.',
          ],
        },
      ],
    },
    {
      title: 'Ibitemewe mu bitekerezo',
      tocLabel: 'Ibitemewe',
      blocks: [
        { type: 'paragraph', text: 'Ibitekerezo bishobora gukurwaho iyo:' },
        {
          type: 'reasons',
          items: [
            'Birimo {{imvugo z’urwango, ivangura}} cyangwa gushishikariza urugomo',
            'Birimo {{ibitutsi, gutoteza}} cyangwa kwibasira umuntu.',
            'Bikwirakwiza {{amakuru y’ibinyoma}}, cyangwa ayobya abantu',
            '{{Bitesha agaciro umuntu}}, cyangwa ubumwe bw’Abanyarwanda n’imibanire myiza yabo',
            'Birimo amagambo y’{{ibitera soni, ihohotera}} cyangwa ibindi binyuranyije n’amategeko.',
          ],
        },
      ],
    },
    {
      title: 'Kubazwa inshingano no gukorera mu mucyo',
      tocLabel: 'Gukorera mu mucyo',
      blocks: [
        { type: 'paragraph', text: 'Ibyemezo bifatwa ku bitekerezo byagenzuwe bishingira ku mahame n’ubushishozi bwa IGIHE.' },
        { type: 'paragraph', text: 'IGIHE ifite uburenganzira bwo {{gukuraho nta nteguza}} igitekerezo icyo ari cyo cyose kinyuranyije n’amahame yayo.' },
        { type: 'callout', text: 'Kugenzura ibitekerezo bigamije {{kurinda ubwisanzure mu biganiro}}, ntabwo ari kubuza abantu gutanga ibitekerezo cyangwa kunenga.' },
      ],
    },
  ],
}
