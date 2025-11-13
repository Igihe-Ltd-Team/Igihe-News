import React from 'react'
import HeaderDivider from '@/components/HeaderDivider'
import VideoCard from '@/components/vidoes/VideoCard'
export default function page() {
  return (
    <div className='container py-4'>
       <HeaderDivider title="Latest Videos" />
       <div className="video-container d-flex gap-3 pt-4">
            <VideoCard />
            <VideoCard />
            <VideoCard />
            <VideoCard />
       </div>
       
    </div>
  )
}
