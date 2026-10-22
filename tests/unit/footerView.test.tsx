import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

jest.mock('@/components/layout/footer/FooterNewsletterForm', () => ({
  __esModule: true,
  default: () => React.createElement('form', { id: 'newsletter-stub' }),
}))

import FooterView from '@/components/layout/FooterView'
import FooterNewsletterForm from '@/components/layout/footer/FooterNewsletterForm'
import { DEFAULT_FOOTER } from '@/lib/footer/footerDefaults'
import { footerConfigSchema } from '@/lib/footer/footerSchema'

describe('FooterView', () => {
  it('the built-in footer config is valid', () => {
    expect(footerConfigSchema.safeParse(DEFAULT_FOOTER).success).toBe(true)
  })

  it('renders the redesigned layout from the built-in config', () => {
    const html = renderToStaticMarkup(<FooterView config={DEFAULT_FOOTER} newsletterForm={<FooterNewsletterForm />} year={2026} />)
    expect(html).toContain('class="ft"')
    expect(html).toContain('id="newsletter-stub"')
    expect(html).toContain('Subscribe to our newsletter')
    expect(html).toContain('The stories that matter. In your inbox.')
    expect(html).toContain('aria-label="Facebook"')
    expect(html).toContain('href="/news"')
    expect(html).toContain('href="/science-technology"')
    expect(html).toContain('TAKE US WITH YOU')
    expect(html).toContain('© 2026 IGIHE.com. All rights reserved.')
    expect(html).toContain('href="https://apps.apple.com/rw/app/igihe/id6476150020"')
    expect(html).toContain('Download on the')
    expect(html).toContain('GET IT ON')
    expect(html).toContain('>Cookie policy<')
  })

  it('keeps the design\'s five social links, in its order', () => {
    const html = renderToStaticMarkup(<FooterView config={DEFAULT_FOOTER} newsletterForm={null} />)
    const order = ['Facebook', 'X (Twitter)', 'Instagram', 'YouTube', 'WhatsApp'].map(label => html.indexOf(`aria-label="${label}"`))
    expect(order.every(index => index >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('renders the same content for a config that went through JSON', () => {
    const roundTripped = footerConfigSchema.parse(JSON.parse(JSON.stringify(DEFAULT_FOOTER)))
    const a = renderToStaticMarkup(<FooterView config={DEFAULT_FOOTER} newsletterForm={null} />)
    const b = renderToStaticMarkup(<FooterView config={roundTripped} newsletterForm={null} />)
    expect(b).toBe(a)
  })

  it('shows edited content, in order, and adds noopener to new-tab links', () => {
    const config = structuredClone(DEFAULT_FOOTER)
    config.bottom.companyName = 'ACME'
    config.bottom.links = [{ id: 'x', label: 'Privacy', url: '/privacy', newTab: false }]
    const social = config.columns.find(column => column.type === 'social')
    if (!social || social.type !== 'social') throw new Error('fixture')
    social.items = [{ id: 'tg', label: 'Telegram', url: 'https://t.me/igihe', icon: 'telegram', newTab: true, boxed: false }]

    const html = renderToStaticMarkup(<FooterView config={config} newsletterForm={null} year={2030} />)
    expect(html).toContain('ACME')
    expect(html).toContain('2030')
    expect(html).toContain('href="/privacy"')
    expect(html).toContain('href="https://t.me/igihe" target="_blank" rel="noopener noreferrer"')
    expect(html).not.toContain('Facebook')
  })

  it('renders a footer with no columns and no links without failing', () => {
    const empty = { columns: [], bottom: { startYear: 2008, companyName: 'X', links: [] } }
    expect(() => renderToStaticMarkup(<FooterView config={empty} newsletterForm={null} />)).not.toThrow()
  })
})
