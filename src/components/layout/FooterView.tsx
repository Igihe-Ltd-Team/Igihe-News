import type { ReactNode } from 'react'
import Link from 'next/link'
import { FooterIcon } from './footer/FooterIcons'
import { FooterLogo } from './footer/FooterLogo'
import { FooterStoreBadge } from './footer/FooterStoreBadge'
import type { FooterColumn, FooterConfig, FooterLink } from '@/lib/footer/footerSchema'
import { Container } from 'react-bootstrap'

// Renders the footer from data. The layout follows the redesign: logo and newsletter on top,
// then "Follow us" and the link columns, then the legal bar. Text, links and icons still come
// from the configuration. It has no server-only dependencies, so the dashboard uses the very
// same component for its live preview.

const linkProps = (item: FooterLink) => ({
  href: item.url,
  target: item.newTab ? '_blank' : undefined,
  // A link that opens a new tab must not hand the new page a handle on this one.
  rel: item.newTab ? 'noopener noreferrer' : undefined,
})

export default function FooterView({
  config,
  newsletterForm,
  year = new Date().getFullYear(),
}: {
  config: FooterConfig
  /** The real signup form on the public site; the dashboard preview passes an inert stand-in. */
  newsletterForm: ReactNode
  year?: number
}) {
  const { columns, bottom } = config
  const newsletter = columns.find(column => column.type === 'newsletter')
  const social = columns.find(column => column.type === 'social')
  const apps = columns.find(column => column.type === 'apps')
  const linkColumns = columns.filter((column): column is Extract<FooterColumn, { type: 'links' }> => column.type === 'links')

  return (
    <footer className="ft">
      <Container className='ft__inner'>
        <div className="ft__top">
          <Link href="/" className="ft__logo" aria-label="IGIHE">
            <FooterLogo />
          </Link>
          {newsletter && newsletter.type === 'newsletter' && (
            <section className="ft__newsletter" aria-label={newsletter.heading}>
              <h3 className="ft__heading">{newsletter.title}</h3>
              <p className="ft__sub">{newsletter.description}</p>
              {newsletterForm}
            </section>
          )}
        </div>

        {(social || linkColumns.length > 0 || apps) && (
          <div className="ft__main">
            {social && social.type === 'social' && (
              <section className="ft__social" aria-label={social.heading}>
                <h3 className="ft__heading">{social.heading}</h3>
                <ul className="ft__social-list list-unstyled">
                  {social.items.map(item => (
                    <li key={item.id}>
                      <a className="ft__social-link" aria-label={item.label} title={item.label} {...linkProps(item)}>
                        <FooterIcon name={item.icon} />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {linkColumns.length > 0 && (
              <div className="ft__links">
                {linkColumns.map(column => (
                  <nav key={column.id} className="ft__col" aria-label={column.heading}>
                    <h3 className="ft__heading">{column.heading}</h3>
                    <ul className="ft__list list-unstyled">
                      {column.items.map(item => (
                        <li key={item.id}>
                          <a className="ft__link" {...linkProps(item)}>{item.label}</a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ))}
              </div>
            )}
            {apps && apps.type === 'apps' && (
              <section className="ft__apps" aria-label={apps.heading}>
                <h3 className="ft__heading">{apps.heading}</h3>
                <p className="ft__apps-sub">{apps.description}</p>
                <ul className="ft__badges list-unstyled">
                  {apps.items.map(item => (
                    <li key={item.id}>
                      <a className="ft__badge" {...linkProps(item)}>
                        <FooterStoreBadge store={item.store} label={item.label} />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <div className="ft__bottom">
          <p className="ft__copy">{`© ${bottom.startYear && bottom.startYear < year ? `${bottom.startYear} - ` : ''}${year} ${bottom.companyName}`}</p>
          <ul className="ft__legal list-unstyled">
            {bottom.links.map(link => (
              <li key={link.id}>
                <a className="ft__legal-link" {...linkProps(link)}>{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  )
}
