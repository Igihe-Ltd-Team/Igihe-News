import type { FooterConfig } from './footerSchema'

/**
 * The footer of the English site, laid out as in the footer design ("Footer (Redesign Footer
 * Variations)"): newsletter next to the logo, then "Follow Us", three link columns and the app
 * badges, then the legal bar. The design's column labels are Kinyarwanda; these are their English
 * counterparts, pointing at this site's own sections.
 */
export const DEFAULT_FOOTER: FooterConfig = {
  columns: [
    {
      id: 'newsletter',
      type: 'newsletter',
      heading: 'Newsletter',
      title: 'Subscribe to our newsletter',
      description: 'The stories that matter. In your inbox.',
    },
    {
      id: 'social',
      type: 'social',
      heading: 'Follow Us',
      items: [
        { id: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/igihe', icon: 'facebook', newTab: true, boxed: false },
        { id: 'x', label: 'X (Twitter)', url: 'https://x.com/igihe', icon: 'x', newTab: true, boxed: false },
        { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/igiheofficial', icon: 'instagram', newTab: true, boxed: false },
        { id: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@IGIHE_Official', icon: 'youtube', newTab: true, boxed: false },
        { id: 'whatsapp', label: 'WhatsApp', url: 'https://whatsapp.com/channel/0029VaESIcN5a249FL5Clf12', icon: 'whatsapp', newTab: true, boxed: false },
      ],
    },
    {
      id: 'news',
      type: 'links',
      heading: 'News',
      items: [
        { id: 'news-latest', label: 'News', url: '/news', newTab: false },
        { id: 'business', label: 'Business', url: '/business', newTab: false },
        { id: 'sports', label: 'Sports', url: '/sports', newTab: false },
        { id: 'entertainment', label: 'Entertainment', url: '/entertainment', newTab: false },
        { id: 'health', label: 'Health', url: '/health', newTab: false },
        { id: 'technology', label: 'Science & Technology', url: '/science-technology', newTab: false },
        { id: 'video', label: 'Video', url: '/videos', newTab: false },
      ],
    },
    {
      id: 'igihe',
      type: 'links',
      heading: 'IGIHE',
      items: [
        { id: 'igihe-about', label: 'About us', url: 'https://igihe.africa/about-us/', newTab: true },
        { id: 'igihe-contact', label: 'Contact us', url: 'https://igihe.africa/contact-us/', newTab: true },
        { id: 'igihe-terms', label: 'Terms of use', url: '/terms-of-use', newTab: false },
        { id: 'igihe-sitemap', label: 'Sitemap', url: '/sitemap.xml', newTab: false },
      ],
    },
    {
      id: 'connect',
      type: 'links',
      heading: 'Get in touch',
      items: [
        { id: 'connect-ads', label: 'Advertise', url: 'https://igihe.africa/', newTab: true },
        { id: 'connect-tips', label: 'Send us a story', url: 'https://igihe.africa/contact-us/', newTab: true },
        { id: 'connect-announcements', label: 'Announcements', url: '/announcements', newTab: false },
        { id: 'connect-jobs', label: 'Jobs & Tenders', url: '/announcements', newTab: false },
        { id: 'connect-partners', label: 'Partnerships', url: 'https://igihe.africa/contact-us/', newTab: true },
      ],
    },
    {
      id: 'apps',
      type: 'apps',
      heading: 'TAKE US WITH YOU',
      description: 'Your world. One tap away.',
      items: [
        { id: 'app-apple', label: 'App Store', url: 'https://apps.apple.com/rw/app/igihe/id6476150020', newTab: true, store: 'apple' },
        { id: 'app-google', label: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.elamirizidani.Igihe', newTab: true, store: 'google' },
      ],
    },
  ],
  bottom: {
    companyName: 'IGIHE.com. All rights reserved.',
    links: [
      { id: 'terms', label: 'Terms of use', url: '/terms-of-use', newTab: false },
      { id: 'privacy', label: 'Privacy policy', url: '/privacy-policy', newTab: false },
      { id: 'cookies', label: 'Cookie policy', url: '/cookie-policy', newTab: false },
      { id: 'sitemap', label: 'Sitemap', url: '/sitemap.xml', newTab: false },
    ],
  },
}
