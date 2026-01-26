"use client"

import { useState, useEffect } from 'react'

// Define breakpoint constants
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  largeDesktop: 1920
} as const

// Device type
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'largeDesktop'

// Return type for the hook
export interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLargeDesktop: boolean
  deviceType: DeviceType
  width: number
  height: number
}

/**
 * Custom hook to detect device type and screen dimensions
 * @param debounceMs - Debounce delay in milliseconds (default: 150ms)
 * @returns ResponsiveState object with device info
 * 
 * @example
 * const { isMobile, deviceType, width } = useResponsive()
 * 
 * if (isMobile) {
 *   return <MobileView />
 * }
 */
export function useResponsive(debounceMs: number = 150): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    // Initialize with SSR-safe defaults
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        deviceType: 'desktop',
        width: 1024,
        height: 768
      }
    }

    // Client-side initialization
    const width = window.innerWidth
    return getResponsiveState(width, window.innerHeight)
  })

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const handleResize = () => {
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // Debounce the resize event
      timeoutId = setTimeout(() => {
        const width = window.innerWidth
        const height = window.innerHeight
        setState(getResponsiveState(width, height))
      }, debounceMs)
    }

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [debounceMs])

  return state
}

/**
 * Helper function to calculate responsive state
 */
function getResponsiveState(width: number, height: number): ResponsiveState {
  const isMobile = width < BREAKPOINTS.mobile
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet
  const isDesktop = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.largeDesktop
  const isLargeDesktop = width >= BREAKPOINTS.largeDesktop

  let deviceType: DeviceType = 'desktop'
  if (isMobile) deviceType = 'mobile'
  else if (isTablet) deviceType = 'tablet'
  else if (isLargeDesktop) deviceType = 'largeDesktop'

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    deviceType,
    width,
    height
  }
}

/**
 * Utility function for one-time device detection (non-reactive)
 * Useful for server-side rendering or one-off checks
 * 
 * @example
 * const device = getDeviceType()
 * if (device === 'mobile') {
 *   // Do something
 * }
 */
export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  if (width < BREAKPOINTS.mobile) return 'mobile'
  if (width < BREAKPOINTS.tablet) return 'tablet'
  if (width < BREAKPOINTS.largeDesktop) return 'desktop'
  return 'largeDesktop'
}

/**
 * Check if current device matches a specific type
 * @example
 * if (isDevice('mobile')) {
 *   console.log('Mobile device detected')
 * }
 */
export function isDevice(type: DeviceType): boolean {
  return getDeviceType() === type
}

/**
 * Custom hook for media query matching
 * @param query - CSS media query string
 * @returns boolean indicating if query matches
 * 
 * @example
 * const isPortrait = useMediaQuery('(orientation: portrait)')
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } 
    // Legacy browsers
    else {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [query])

  return matches
}