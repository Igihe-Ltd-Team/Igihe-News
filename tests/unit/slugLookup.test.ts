import { decodeSlugParam, encodeSegment, isPlainSlug, sameSlug, slugSearchTerms } from '@/lib/slugLookup'

describe('isPlainSlug', () => {
  it('accepts ASCII letters, digits, hyphens and underscores only', () => {
    expect(isPlainSlug('rwanda-scoops-award_2')).toBe(true)
    expect(isPlainSlug('Mixed-CASE-1')).toBe(true)
  })

  it('rejects accents, invisible characters, spaces and empty input', () => {
    expect(isPlainSlug('ngugĩ-wa-thiong-o')).toBe(false)
    expect(isPlainSlug('keep‎-children')).toBe(false)
    expect(isPlainSlug('crisis-in mali')).toBe(false)
    expect(isPlainSlug('has space')).toBe(false)
    expect(isPlainSlug('')).toBe(false)
  })
})

describe('sameSlug', () => {
  it('treats composed and decomposed accents as equal', () => {
    expect(sameSlug('ngugĩ-wa', 'ngugĩ-wa')).toBe(true)
  })

  it('does not treat different slugs, or a stripped invisible character, as equal', () => {
    expect(sameSlug('keep‎-children', 'keep-children')).toBe(false)
    expect(sameSlug('a-b', 'a-c')).toBe(false)
  })
})

describe('encodeSegment', () => {
  it('leaves plain slugs untouched and encodes everything else', () => {
    expect(encodeSegment('plain-slug_1')).toBe('plain-slug_1')
    expect(encodeSegment('ngugĩ-wa')).toBe('ngug%C4%A9-wa')
    expect(encodeSegment('to-‎keep')).toBe('to-%E2%80%8Ekeep')
    expect(encodeSegment("it's (here)!")).toBe('it%27s%20%28here%29%21')
  })
})

describe('slugSearchTerms', () => {
  it('keeps the longest plain words and drops words that contain accents', () => {
    expect(slugSearchTerms('ngugĩ-wa-thiong-o-the-defiant-wordsmith-who-rewrote-the-african-narrative')).toEqual(
      ['narrative', 'wordsmith', 'african', 'defiant', 'rewrote']
    )
  })

  it('treats unusual spaces as word separators', () => {
    expect(slugSearchTerms('au-pledges-to-help-resolve-crisis-in mali')).toEqual(
      ['pledges', 'resolve', 'crisis', 'help', 'mali']
    )
  })

  it('removes zero-width characters that sit inside words instead of splitting on them', () => {
    expect(slugSearchTerms('covid-19-‌-‌rwanda‌-‌reports‌-‌cases')).toEqual(
      ['reports', 'rwanda', 'cases', 'covid']
    )
    expect(slugSearchTerms('​whatsapp-now-one-billion-people-send-55')).toEqual(
      ['whatsapp', 'billion', 'people', 'send']
    )
  })

  it('drops numbers, which titles often format differently', () => {
    expect(slugSearchTerms('250000-tons-capacity-opens')).toEqual(['capacity', 'opens', 'tons'])
  })

  it('honours the limit and returns nothing when no plain word is left', () => {
    expect(slugSearchTerms('alpha-bravo-charlie-delta-echo-foxtrot', 3)).toHaveLength(3)
    expect(slugSearchTerms('ϊσ-ĩē')).toEqual([])
  })
})

describe('decodeSlugParam', () => {
  it('decodes a percent-encoded param so the page and generateMetadata agree', () => {
    expect(decodeSlugParam('ngug%C4%A9-wa-thiong-o')).toBe('ngug\u0129-wa-thiong-o')
    expect(decodeSlugParam('parents-reminded-to-%E2%80%8Ekeep')).toBe('parents-reminded-to-\u200ekeep')
    expect(decodeSlugParam('crisis-in%E2%80%88mali')).toBe('crisis-in\u2008mali')
  })

  it('leaves an already decoded or plain slug alone', () => {
    expect(decodeSlugParam('ngug\u0129-wa-thiong-o')).toBe('ngug\u0129-wa-thiong-o')
    expect(decodeSlugParam('plain-slug-1')).toBe('plain-slug-1')
  })

  it('returns a malformed sequence unchanged instead of throwing', () => {
    expect(decodeSlugParam('bad-%E2%80-seq')).toBe('bad-%E2%80-seq')
    expect(decodeSlugParam('100%')).toBe('100%')
  })
})
