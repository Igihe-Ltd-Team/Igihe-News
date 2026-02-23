"use client"
// app/components/HeaderClient.tsx (Client Component)
import { useState, ReactNode } from 'react'
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
      <div className="row flex align-items-center py-2 justify-content-between header-row-cotainer">
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
    </>
  )
}