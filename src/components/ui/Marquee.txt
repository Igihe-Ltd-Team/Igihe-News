'use client'

import { ReactNode } from 'react'

interface MarqueeProps {
  children: ReactNode
  speed?: number
  direction?: 'left' | 'right'
  pauseOnHover?: boolean
}

export function Marquee({ 
  children, 
  speed = 50, 
  direction = 'left',
  pauseOnHover = true 
}: MarqueeProps) {
  const animation = {
    animationDuration: `${speed}s`,
    animationDirection: direction === 'left' ? 'normal' : 'reverse'
  }

  return (
    <div className="overflow-hidden relative">
      <div
        className={cn(
          'flex whitespace-nowrap',
          pauseOnHover && 'hover:animation-pause',
          direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'
        )}
        style={animation}
      >
        {children}
      </div>
    </div>
  )
}