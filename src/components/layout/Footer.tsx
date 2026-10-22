import { DEFAULT_FOOTER } from '@/lib/footer/footerDefaults'
import FooterNewsletterForm from './footer/FooterNewsletterForm'
import FooterView from './FooterView'

// The public footer, rendered from the built-in configuration in lib/footer/footerDefaults.
export function Footer() {
  return <FooterView config={DEFAULT_FOOTER} newsletterForm={<FooterNewsletterForm />} />
}
