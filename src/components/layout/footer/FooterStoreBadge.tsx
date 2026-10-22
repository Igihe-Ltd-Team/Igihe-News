import type { FooterAppStore } from '@/lib/footer/footerSchema'

// The store marks are code, not data: a badge only says "apple" or "google". Both are the
// exact SVGs of the footer design (Figma nodes 2085:2357 and 2085:2365).

const AppleLogo = () => (
  <svg width="17" height="22" viewBox="0 0 17 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12.7503 11.0002C12.7503 8.87516 14.167 8.16683 14.8753 7.4585C13.4586 5.3335 11.3336 5.3335 10.6253 6.04183L8.5003 6.75016L6.3753 6.04183C2.83363 4.62516 0.708635 8.16683 1.41697 11.7085C2.1253 15.2502 4.2503 19.5002 6.3753 18.7918L8.5003 18.0835L10.6253 18.7918C12.7503 19.5002 14.167 16.6668 15.5836 13.8335C13.4586 13.1252 12.7503 11.7085 12.7503 11.0002ZM8.5003 5.3335C8.5003 3.2085 9.91697 1.79183 12.042 1.0835C12.042 3.2085 10.6253 5.3335 8.5003 5.3335Z" fill="#152C40"/></svg>
)

const GooglePlayLogo = () => (
  <svg width="17" height="22" viewBox="0 0 17 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1.41699 1.7915V20.2082L10.6253 10.9998L1.41699 1.7915Z" fill="#45D5A4"/><path d="M1.41699 1.7915L13.4587 8.87484L10.6253 10.9998L1.41699 1.7915Z" fill="#58B7FF"/><path d="M13.4583 8.875L16.2917 11L13.4583 13.125L10.625 11L13.4583 8.875Z" fill="#FFD364"/><path d="M1.41699 20.2083L13.4587 13.125L10.6253 11L1.41699 20.2083Z" fill="#FA716F"/></svg>
)

const CAPTION: Record<FooterAppStore, string> = { apple: 'Download on the', google: 'GET IT ON' }

export function FooterStoreBadge({ store, label }: { store: FooterAppStore; label: string }) {
  return (
    <>
      <span className="ft__badge-icon">{store === 'apple' ? <AppleLogo /> : <GooglePlayLogo />}</span>
      <span className="ft__badge-text">
        <span className="ft__badge-caption">{CAPTION[store]}</span>
        <span className="ft__badge-name">{label}</span>
      </span>
    </>
  )
}
