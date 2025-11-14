'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiService } from '@/services/apiService'
import HeaderDivider from '../HeaderDivider'
import HomeVideoCard from '../videos/HomeVideoCard'
import CustomSlider from './CustomSlider'
import NewsSkeleton from '../NewsSkeleton'
import OpionCard from '../opinion/OpionCard'

export default function Opinios() {
  const { data: opinions, isLoading, error } = useQuery({
    queryKey: ['opinions'],
    queryFn: () => ApiService.fetchOpinions({ per_page: 4 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return (
      <>
        <HeaderDivider title="Opinions" />
        <NewsSkeleton count={3}/>
      </>
    )
  }

  if (error) {
    return (
      <>
        <HeaderDivider title="Opinions" />
        <div className="text-red-500">Failed to load videos</div>
      </>
    )
  }

  return (
    <div className='mb-4 mt-2'>
      <HeaderDivider title="Opinions" />
      <div className='g-2'>
        {
            opinions?.map(opinion => <OpionCard key={opinion.id} article={opinion}/>)
        }
        </div>
      {/* <Slides articles={videos || []} lgDisplay={3} mdDisplay={2} smDisplay={1} showControll /> */}
    </div>
  )
}