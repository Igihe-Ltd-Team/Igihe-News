"use client"
// app/components/HeaderClient.tsx (Client Component)
import { useState, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Languages from '../ui/Languages'
import ThemeSwitcher from '../ui/ThemeSwitcher'
import { useResponsive } from '@/hooks/useResponsive'
import IgiheCanvas from './IgiheCanvas'
import { ThemedText } from '../ThemedText'
import SearchModal from '../SearchModal'

interface HeaderClientProps {
  categories: any[]
  logoSection: ReactNode
  desktopAdSection: ReactNode
}

export default function HeaderClient({ 
  categories, 
  logoSection,
  desktopAdSection 
}: HeaderClientProps) {
  const pathname = usePathname()
  const { isMobile } = useResponsive()
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)

  return (
    <>
      {/* Language switch section */}
      <div className={`d-flex align-items-center justify-content-between bg-white-black px-4`}>
        <div className="col-md-8 lang-switcher d-flex align-items-center">
          <Languages />
        </div>
        <div className="col-md-4 theme-switcher align-items-end d-flex justify-content-end py-2">
          <ThemeSwitcher />
        </div>
      </div>

      {/* Logo and banner */}
      <div className="row flex align-items-center py-2 justify-content-between">
        <div className={`col-md-5 site-logo-wrapper ${isMobile && 'd-flex justify-content-between'}`}>
          {logoSection}
          
          {isMobile && (
            <IgiheCanvas 
              categories={categories} 
              showHome 
              btnVariant='light' 
            />
          )}
        </div>
        
        {!isMobile && desktopAdSection}
      </div>

      {/* Menus section - Desktop only */}
      {!isMobile && (
        <div className={`igihe-nav-menu bg-white-black`}>
          <nav className="navbar navbar-expand-lg">
            <div style={{ flex: 1 }}>
              <button 
                className="navbar-toggler" 
                type="button" 
                data-bs-toggle="collapse" 
                data-bs-target="#navbarScroll" 
                aria-controls="navbarScroll" 
                aria-expanded="false" 
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon">
                  <svg width="26" height="21" viewBox="0 0 26 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.6031 9.625H8.55076C7.99168 9.625 7.53845 9.99325 7.53845 10.4475V10.5525C7.53845 11.0068 7.99168 11.375 8.55076 11.375H21.6031C22.1621 11.375 22.6154 11.0068 22.6154 10.5525V10.4475C22.6154 9.99325 22.1621 9.625 21.6031 9.625Z" fill="#282F2F" />
                    <path d="M21.603 14H4.24302C3.68394 14 3.23071 14.3682 3.23071 14.8225V14.9275C3.23071 15.3818 3.68394 15.75 4.24302 15.75H21.603C22.1621 15.75 22.6153 15.3818 22.6153 14.9275V14.8225C22.6153 14.3682 22.1621 14 21.603 14Z" fill="#282F2F" />
                    <path d="M21.603 5.25H4.24302C3.68394 5.25 3.23071 5.61825 3.23071 6.0725V6.1775C3.23071 6.63175 3.68394 7 4.24302 7H21.603C22.1621 7 22.6153 6.63175 22.6153 6.1775V6.0725C22.6153 5.61825 22.1621 5.25 21.603 5.25Z" fill="#282F2F" />
                  </svg>
                </span>
              </button>
              
              <div className="collapse navbar-collapse gap-3" id="navbarScroll d-flex justify-content-between">
                <ul className="navbar-nav me-auto my-2 my-lg-0 navbar-nav-scroll" style={{ ['--bs-scroll-height' as any]: '100px;' }}>
                  {/* Home Link */}
                  <li className="nav-item">
                    <Link className="nav-link active d-flex align-items-center" aria-current="page" href="/?fromNav=1">
                      <span className="nav-hover-effect d-flex">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_1277_4757)">
                            <path d="M-7.82013e-05 4.08562C0.00609398 4.00223 0.0369568 3.93028 0.0630178 3.85832C0.355179 3.05469 0.820168 2.35664 1.41409 1.73794C1.80433 1.33108 2.23571 0.973315 2.74047 0.706335C3.3344 0.39228 3.97084 0.204653 4.63541 0.104451C5.05513 0.0412364 5.4776 -0.0071826 5.90349 0.000887394C6.83553 0.0176997 7.72573 0.205998 8.53226 0.680779C9.27226 1.11588 9.77086 1.73727 9.94643 2.57856C10.1131 3.37479 9.89088 4.05334 9.26472 4.59537C8.99793 4.82671 8.67902 4.94776 8.32651 4.98273C7.79637 5.03518 7.28269 4.97533 6.79781 4.74534C6.51388 4.61084 6.26561 4.42792 6.04135 4.21138C5.79719 3.976 5.56676 3.72718 5.29997 3.51535C4.83361 3.14413 4.29044 2.94171 3.7116 2.81931C3.05252 2.68011 2.3955 2.67405 1.74809 2.87984C1.06775 3.09638 0.507431 3.48508 0.0678177 4.03855C0.0534153 4.0567 0.043128 4.08091 -0.000764847 4.08629L-7.82013e-05 4.08562Z" fill="#1176BB" />
                          </g>
                          <g clipPath="url(#clip1_1277_4757)">
                            <path d="M10.0001 5.91438C9.99391 5.99777 9.96304 6.06972 9.93698 6.14168C9.64482 6.94531 9.17983 7.64336 8.58591 8.26206C8.19567 8.66892 7.76429 9.02668 7.25953 9.29367C6.6656 9.60772 6.02916 9.79535 5.36459 9.89555C4.94487 9.95876 4.5224 10.0072 4.09651 9.99911C3.16447 9.9823 2.27427 9.794 1.46774 9.31922C0.727738 8.88412 0.229144 8.26273 0.0535728 7.42144C-0.113082 6.62521 0.109125 5.94666 0.735282 5.40463C1.00207 5.17329 1.32098 5.05224 1.67349 5.01727C2.20363 4.96482 2.71731 5.02467 3.20219 5.25466C3.48612 5.38916 3.73439 5.57208 3.95865 5.78862C4.20281 6.024 4.43324 6.27282 4.70003 6.48465C5.16639 6.85587 5.70956 7.05829 6.2884 7.18069C6.94748 7.31989 7.6045 7.32595 8.25191 7.12016C8.93225 6.90362 9.49257 6.51492 9.93218 5.96145C9.94658 5.9433 9.95687 5.91909 10.0008 5.91371L10.0001 5.91438Z" fill="#1176BB" />
                          </g>
                          <defs>
                            <clipPath id="clip0_1277_4757">
                              <rect width="10" height="5" fill="white" transform="matrix(-1 0 0 -1 10 5)" />
                            </clipPath>
                            <clipPath id="clip1_1277_4757">
                              <rect width="10" height="5" fill="white" transform="translate(0 5)" />
                            </clipPath>
                          </defs>
                        </svg>
                      </span>
                      <ThemedText 
                        type={pathname === `/` ? 'defaultSemiBold' : 'default'} 
                        darkColor='#fff' 
                        lightColor={pathname === `/` ? '#1176BB' : '#282F2F'}
                      >
                        Home
                      </ThemedText>
                    </Link>
                  </li>

                  {/* Category Links */}
                  {categories && categories.length > 0 ? (
                    categories.map((NavItem: any, index: number) => {
                      const isHovered = hoveredSlug === NavItem.slug
                      return (
                        <li className="nav-item" key={index}>
                          <Link 
                            href={`/${NavItem.slug}`} 
                            prefetch={true} 
                            className="nav-link active d-flex align-items-center"
                            onMouseEnter={() => setHoveredSlug(NavItem.slug)}
                            onMouseLeave={() => setHoveredSlug(null)}
                          >
                            <span className="nav-hover-effect d-flex">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clipPath="url(#clip0_1277_4757)">
                                  <path d="M-7.82013e-05 4.08562C0.00609398 4.00223 0.0369568 3.93028 0.0630178 3.85832C0.355179 3.05469 0.820168 2.35664 1.41409 1.73794C1.80433 1.33108 2.23571 0.973315 2.74047 0.706335C3.3344 0.39228 3.97084 0.204653 4.63541 0.104451C5.05513 0.0412364 5.4776 -0.0071826 5.90349 0.000887394C6.83553 0.0176997 7.72573 0.205998 8.53226 0.680779C9.27226 1.11588 9.77086 1.73727 9.94643 2.57856C10.1131 3.37479 9.89088 4.05334 9.26472 4.59537C8.99793 4.82671 8.67902 4.94776 8.32651 4.98273C7.79637 5.03518 7.28269 4.97533 6.79781 4.74534C6.51388 4.61084 6.26561 4.42792 6.04135 4.21138C5.79719 3.976 5.56676 3.72718 5.29997 3.51535C4.83361 3.14413 4.29044 2.94171 3.7116 2.81931C3.05252 2.68011 2.3955 2.67405 1.74809 2.87984C1.06775 3.09638 0.507431 3.48508 0.0678177 4.03855C0.0534153 4.0567 0.043128 4.08091 -0.000764847 4.08629L-7.82013e-05 4.08562Z" fill="#1176BB" />
                                </g>
                                <g clipPath="url(#clip1_1277_4757)">
                                  <path d="M10.0001 5.91438C9.99391 5.99777 9.96304 6.06972 9.93698 6.14168C9.64482 6.94531 9.17983 7.64336 8.58591 8.26206C8.19567 8.66892 7.76429 9.02668 7.25953 9.29367C6.6656 9.60772 6.02916 9.79535 5.36459 9.89555C4.94487 9.95876 4.5224 10.0072 4.09651 9.99911C3.16447 9.9823 2.27427 9.794 1.46774 9.31922C0.727738 8.88412 0.229144 8.26273 0.0535728 7.42144C-0.113082 6.62521 0.109125 5.94666 0.735282 5.40463C1.00207 5.17329 1.32098 5.05224 1.67349 5.01727C2.20363 4.96482 2.71731 5.02467 3.20219 5.25466C3.48612 5.38916 3.73439 5.57208 3.95865 5.78862C4.20281 6.024 4.43324 6.27282 4.70003 6.48465C5.16639 6.85587 5.70956 7.05829 6.2884 7.18069C6.94748 7.31989 7.6045 7.32595 8.25191 7.12016C8.93225 6.90362 9.49257 6.51492 9.93218 5.96145C9.94658 5.9433 9.95687 5.91909 10.0008 5.91371L10.0001 5.91438Z" fill="#1176BB" />
                                </g>
                                <defs>
                                  <clipPath id="clip0_1277_4757">
                                    <rect width="10" height="5" fill="white" transform="matrix(-1 0 0 -1 10 5)" />
                                  </clipPath>
                                  <clipPath id="clip1_1277_4757">
                                    <rect width="10" height="5" fill="white" transform="translate(0 5)" />
                                  </clipPath>
                                </defs>
                              </svg>
                            </span>
                            <ThemedText
                              style={{ textTransform: 'capitalize' }}
                              type={pathname === `/${NavItem.slug}` ? 'defaultSemiBold' : 'default'}
                              darkColor='#fff'
                              lightColor={pathname === `/${NavItem.slug}` ? '#1176BB' : isHovered ? '#1176BB': '#282F2F'}
                            >
                              {NavItem?.name || 'Home'}
                            </ThemedText>
                          </Link>
                        </li>
                      )
                    })
                  ) : (
                    <li className="nav-item text-muted"></li>
                  )}
                </ul>

                <div className="right-options d-flex align-items-center">
                  <SearchModal />
                  <IgiheCanvas btnVariant='' categories={[]} />
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}