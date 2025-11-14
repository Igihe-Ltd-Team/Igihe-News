'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiService } from '@/services/apiService'
import HeaderDivider from '../HeaderDivider'
import Slides from './Slides'
import HomeVideoCard from '../videos/HomeVideoCard'
import CustomSlider from './CustomSlider'
import NewsSkeleton from '../NewsSkeleton'

export default function Videos() {
  const { data: videos, isLoading, error } = useQuery({
    queryKey: ['videos'],
    queryFn: () => ApiService.fetchVideos({ per_page: 9 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return (
      <>
        <HeaderDivider title="Latest Videos" />
        <NewsSkeleton count={3}/>
      </>
    )
  }

  if (error) {
    return (
      <>
        <HeaderDivider title="Latest Videos" />
        <div className="text-red-500">Failed to load videos</div>
      </>
    )
  }

  return (
    <div className='mb-4 mt-2'>
      <HeaderDivider title="Latest Videos" />
      <CustomSlider showControll lgDisplay={3} mdDisplay={2} smDisplay={1}>
        {
            videos?.map(video => <HomeVideoCard key={video.id} article={video}/>)
        }
      </CustomSlider>
      {/* <Slides articles={videos || []} lgDisplay={3} mdDisplay={2} smDisplay={1} showControll /> */}
    </div>
  )
}