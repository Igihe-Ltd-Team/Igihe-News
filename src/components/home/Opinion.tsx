'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiService } from '@/services/apiService'
import HeaderDivider from '../HeaderDivider'
import HomeVideoCard from '../videos/HomeVideoCard'
import CustomSlider from './CustomSlider'
import NewsSkeleton from '../NewsSkeleton'
import OpionCard from '../opinion/OpionCard'
import { useOpinion } from '@/hooks/useMainNewsData'

export default function Opinios() {

  const { data,isLoading,error } = useOpinion()


  if (isLoading) {
    return (
      <>
        <HeaderDivider title="Opinions" />
        <NewsSkeleton count={1}/>
      </>
    )
  }

  if (error) {
    return (
      <>
        <HeaderDivider title="Opinions" />
        <div className="text-red-500">Failed to load Opinions</div>
      </>
    )
  }

  return (
    <div className='mb-4 mt-2'>
      <HeaderDivider title="Opinions" slug={'opinion'}/>
      <div className='g-2'>
        { 
            data?.data?.map(opinion => <OpionCard key={opinion.id} article={opinion}/>)
        }
        </div>
      {/* <Slides articles={videos || []} lgDisplay={3} mdDisplay={2} smDisplay={1} showControll /> */}
    </div>
  )
}
