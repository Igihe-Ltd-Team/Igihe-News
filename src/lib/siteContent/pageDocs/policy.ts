import { z } from 'zod'
import { PAGE_TEXT_LIMITS, lineText, linkTarget, richText, textList } from './text'

// /policy (privacy policy): a hero, then numbered sections made of the blocks below.

export const POLICY_CALLOUT_VARIANTS = ['shield', 'clock'] as const

const cardSchema = z.object({
  title: lineText(),
  intro: richText(),
  items: textList(),
  note: richText().optional(),
})

export const policyBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: richText() }),
  z.object({ type: z.literal('cards'), cards: z.array(cardSchema).min(1).max(2) }),
  z.object({ type: z.literal('callout'), variant: z.enum(POLICY_CALLOUT_VARIANTS), text: richText() }),
  z.object({ type: z.literal('checklist'), items: textList() }),
  z.object({ type: z.literal('link'), label: lineText(), href: linkTarget }),
  z.object({ type: z.literal('contact'), text: richText() }),
])

export const policySchema = z.object({
  hero: z.object({ eyebrow: lineText(), title: richText(300), lead: richText() }),
  sections: z
    .array(z.object({ title: lineText(), tocLabel: lineText(60), blocks: z.array(policyBlockSchema).min(1, 'A section needs at least one block').max(PAGE_TEXT_LIMITS.maxBlocks) }))
    .min(1, 'The page needs at least one section')
    .max(PAGE_TEXT_LIMITS.maxSections),
})

export type PolicyDoc = z.infer<typeof policySchema>
export type PolicyBlock = z.infer<typeof policyBlockSchema>

const MAIL = 'mailto:privacy@igihe.com'

export const POLICY_DEFAULT: PolicyDoc = {
  hero: {
    eyebrow: 'AMAKURU YAWE. UBURENGANZIRA BWAWE.',
    title: 'Ibijyanye n’amakuru bwite y’abasomyi',
    lead: 'IGIHE Ltd yubaha ubuzima bwawe bwite kandi yiyemeje kurinda amakuru yawe bwite.',
  },
  sections: [
    {
      title: 'Ibyerekeye aya mahame',
      tocLabel: 'Ibyerekeye aya mahame',
      blocks: [
        {
          type: 'paragraph',
          text: 'IGIHE Ltd yubaha ubuzima bwawe bwite kandi yiyemeje kurinda amakuru yawe bwite. Iyi Politiki yo kurinda amakuru bwite isobanura amakuru dukusanya igihe ukoresha urubuga rwa {{IGIHE.com}}, porogaramu za IGIHE zo kuri telefoni, amakuru yohererezwa abasomyi, ahatangirwa ibitekerezo, imbuga nkoranyambaga n’izindi serivisi z’ikoranabuhanga. Isobanura kandi uko dukoresha ayo makuru, uko tuyarinda, igihe ashobora gusangizwa abandi n’uburenganzira ufite ku makuru yawe.',
        },
        {
          type: 'paragraph',
          text: 'IGIHE yakira amakuru bwite hakurikijwe {{Itegeko Nº 058/2021 ryo ku wa 13 Ukwakira 2021}} ryerekeye kurinda amakuru bwite n’imibereho bwite by’umuntu, ndetse n’andi mategeko yose abigenga. Iryo tegeko rireba n’itunganywa ry’amakuru bwite hakoreshejwe ikoranabuhanga cyangwa ubundi buryo, igihe ayo makuru yerekeye abantu bari mu Rwanda.',
        },
      ],
    },
    {
      title: 'Amakuru dukusanya',
      tocLabel: 'Amakuru dukusanya',
      blocks: [
        { type: 'paragraph', text: 'Amakuru dukusanya aterwa n’uburyo ukoresha imbuga za IGIHE.' },
        {
          type: 'cards',
          cards: [
            {
              title: 'Amakuru utanga',
              intro: 'Dushobora gukusanya amakuru utanga igihe:',
              items: [
                'Wiyandikishije kugira ngo ujye wakira amakuru cyangwa ubutumwa bukumenyesha amakuru mashya',
                'Ufunguye konti cyangwa witabiriye irushanwa',
                'Utanze igitekerezo, amakuru, ifoto, amashusho cyangwa igitekerezo mu nyandiko',
                'Utwandikiye ufite ikibazo, ikirego cyangwa usaba gukosora amakuru',
                'Usabye akazi cyangwa kwimenyereza umwuga',
                'Wiyandikishije kugira ngo witabire igikorwa cya IGIHE',
                'Uvuganye n’abashinzwe kwamamaza, gutunganya amashusho, cyangwa ibikorwa by’ubucuruzi.',
              ],
              note: 'Ayo makuru ashobora kuba arimo amazina yawe, email yawe, nimero ya telefoni, aho utuye, ikigo ukorera, amakuru ya konti yawe, uburyo ukunda kubonamo amakuru akugeraho, hamwe n’izindi nyandiko zose watwoherereza.',
            },
            {
              title: 'Amakuru ahita yikusanya',
              intro: 'Igihe ukoresha urubuga cyangwa porogaramu zacu, hari amakuru dushobora guhita dukusanya byikoze. Ayo arimo:',
              items: [
                'Amakuru ya internet ukoresha, {{‘IP address’}}',
                'Amakuru yerekeye igikoresho, porogaramu ukoresha kuri internet',
                'Imbuga wasuye n’igihe wazimazeho',
                'Aho uherereye',
                'Urubuga rwakuyoboye kuri IGIHE',
              ],
            },
          ],
        },
      ],
    },
    {
      title: 'Igihe dushobora gusangiza abandi amakuru',
      tocLabel: 'Gusangiza abandi amakuru',
      blocks: [
        { type: 'paragraph', text: 'IGIHE ishobora gusangiza amakuru bwite make, aba bakurikira:' },
        {
          type: 'paragraph',
          text: '{{Inzego za Leta}}, igihe gutanga ayo makuru bisabwe mu buryo bukurikije amategeko cyangwa ari ngombwa mu kurinda umutekano, uburenganzira cyangwa ubuzima bw’abantu.',
        },
        {
          type: 'paragraph',
          text: 'Abatanga serivisi za IGIHE bakoresha amakuru bwite y’umusomyi ku mpamvu bemerewe kandi bategetswe gushyiraho uburyo bukwiye bwo kuyarinda.',
        },
      ],
    },
    {
      title: 'Kubika amakuru no kuyohereza hanze y’u Rwanda',
      tocLabel: 'Aho tubika amakuru',
      blocks: [
        {
          type: 'paragraph',
          text: 'IGIHE ibika amakuru yose mu Rwanda, keretse igihe ikoresha utanga serivisi wabiherewe uburenganzira cyangwa uburyo bwemewe bwo kubika amakuru buri hanze y’u Rwanda.',
        },
        {
          type: 'paragraph',
          text: 'Iyo amakuru abitswe cyangwa yoherejwe hanze y’u Rwanda, IGIHE ikurikiza ibisabwa bijyanye n’impushya, ingamba z’ubwirinzi zishingiye ku masezerano n’uburyo bwo kurinda umutekano w’amakuru.',
        },
        {
          type: 'paragraph',
          text: 'Amategeko y’u Rwanda agena ko hagomba gusabwa uruhushya cyangwa indi mpamvu yemewe n’amategeko kugira ngo amakuru bwite yoherezwe mu mahanga. Muri rusange, asaba kandi ko kubika amakuru bwite hanze y’igihugu bibanza gutangirwa uruhushya.',
        },
      ],
    },
    {
      title: 'Igihe tumara tubitse amakuru',
      tocLabel: 'Igihe tubika amakuru',
      blocks: [
        {
          type: 'paragraph',
          text: 'IGIHE ibika amakuru bwite gusa mu gihe agikenewe mu mpamvu yakusanyirijwe, kugira ngo yubahirize amategeko cyangwa amasezerano, ikemure amakimbirane cyangwa irengere inyungu z’ubwanditsi n’iz’ikigo.',
        },
        {
          type: 'paragraph',
          text: 'Itegeko ryerekeye kurinda amakuru bwite n’imibereho bwite by’umuntu risaba ko amakuru yangizwa mu buryo butuma adashobora kongera gusubizwa uko yari ameze, nyuma y’uko igihe yagombaga kubikwa kirangiye.',
        },
      ],
    },
    {
      title: 'Uko turinda amakuru yawe',
      tocLabel: 'Uko turinda amakuru',
      blocks: [
        {
          type: 'paragraph',
          text: 'IGIHE ishyiraho ingamba zikwiye z’ikoranabuhanga n’iz’imiyoborere kugira ngo irinde amakuru bwite kubura, gutakara, gukoreshwa nabi, kuyageraho mu buryo butemewe, kuyahindura, kuyashyira ahagaragara, cyangwa kuyangiza.',
        },
        {
          type: 'callout',
          variant: 'shield',
          text: 'Izo ngamba zishobora kubamo kugenzura abafite uburenganzira bwo kugera ku makuru, guhugura abakozi, gukoresha sisitemu zifite umutekano wizewe, guhisha amakuru hakoreshejwe ikoranabuhanga rya {{encryption}}, kugenzura no gushyiraho ibisabwa mu masezerano igirana n’abatanga serivisi.',
        },
      ],
    },
    {
      title: 'Amakuru yerekeye abana',
      tocLabel: 'Amakuru yerekeye abana',
      blocks: [
        { type: 'paragraph', text: 'Serivisi rusange z’amakuru za IGIHE ntabwo zigenewe abana bari {{munsi y’imyaka 16.}}' },
        {
          type: 'paragraph',
          text: 'Iyo IGIHE izi ko ishobora gukusanya amakuru bwite y’umwana uri munsi y’imyaka 16, ibanza kubihererwa uruhushya n’umubyeyi cyangwa umwishingizi we wemewe n’amategeko, keretse igihe gutunganya ayo makuru byemewe n’amategeko cyangwa ari ngombwa mu kurengera inyungu z’umwana.',
        },
        { type: 'paragraph', text: 'Umubyeyi cyangwa umwishingizi ukeka ko umwana yatanze amakuru bwite nta ruhushya, asabwa kubimenyesha IGIHE.' },
        { type: 'link', label: 'Menyesha IGIHE', href: MAIL },
      ],
    },
    {
      title: 'Uburenganzira bwawe',
      tocLabel: 'Uburenganzira bwawe',
      blocks: [
        { type: 'paragraph', text: 'Hakurikijwe amategeko, ushobora gusaba IGIHE:' },
        {
          type: 'checklist',
          items: [
            'Kwemeza niba ifite amakuru yawe bwite',
            'Kuguha uburenganzira bwo kuyabona cyangwa kuguha kopi yayo',
            'Gukosora amakuru atuzuye cyangwa atari yo',
            'Gusiba amakuru atagikenewe',
            'Kugabanya cyangwa guhagarika uburyo bumwe na bumwe ayo makuru atunganywamo',
            'Kureka gukoresha amakuru yawe mu bikorwa byo kwamamaza mu buryo butaziguye',
            'Kohereza amakuru yujuje ibisabwa mu buryo bushobora gusomwa no gukoreshwa',
            'Kuvanaho uruhushya wari waratanze.',
          ],
        },
        { type: 'paragraph', text: 'IGIHE ishobora kugusaba icyemezo kigaragaza umwirondoro wawe mbere yo gusubiza ubusabe bwawe.' },
        { type: 'callout', variant: 'clock', text: 'Ubusabe busanzwe busubizwa mu gihe giteganywa n’amategeko, muri rusange {{kitarenze iminsi 30.}}' },
        {
          type: 'paragraph',
          text: 'Ubusabe bumwe bushobora kutemerwa bwose, igihe amakuru agomba gukomeza kubikwa ku mpamvu z’amategeko, inyungu rusange, itangazamakuru cyangwa inyungu zemewe z’ikigo.',
        },
        { type: 'link', label: 'Ohereza ubusabe', href: MAIL },
      ],
    },
    {
      title: 'Wadusanga hano',
      tocLabel: 'Wadusanga hano',
      blocks: [
        { type: 'paragraph', text: 'Ibibazo, ibirego cyangwa ubusabe bijyanye n’amakuru bwite bigomba koherezwa kuri:' },
        { type: 'contact', text: '{{IGIHE Ltd}}' },
        { type: 'contact', text: '{{Email:}} [privacy@igihe.com->mailto:privacy@igihe.com] cyangwa indi aderesi yabigenewe' },
        { type: 'contact', text: '{{Telefone:}} +250 788 895 953' },
        { type: 'contact', text: '{{Aderesi:}} KG 7 Ave, Kigali, Rwanda' },
      ],
    },
  ],
}
