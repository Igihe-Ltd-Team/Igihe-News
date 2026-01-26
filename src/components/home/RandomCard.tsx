"use client"

import React from 'react'
import { ThemedText } from '../ThemedText'
import { ApiService } from '@/services/apiService'
import { useQuery } from '@tanstack/react-query'
import { stripHtml } from '@/lib/utils'
import { OptimizedImage } from '../ui/OptimizedImage'
import Image from 'next/image'

export default function RandomCard() {

    const { data, isLoading, error } = useQuery({
    queryKey: ['facts'],
    queryFn: () => ApiService.fetchFacts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  
    return (
        <div className='RandomCard'>
            <div className="upper-space">
                <Image
                    width={234}
                    src={'/assets/Facts-of-the-day.png'} 
                    height={49} 
                    className='object-fit-contain' 
                    alt={'Fact of the day'} 
                />
            </div>
            <div className="lower-space">
                <ThemedText>
                    {
                        stripHtml(data?.[0]?.excerpt.rendered || '')
                    }
                </ThemedText>
            </div>
        </div>
    )
}