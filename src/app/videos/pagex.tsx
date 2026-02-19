"use client"

import React from 'react'
import HeaderDivider from '@/components/HeaderDivider'
import { useNewsData } from '@/hooks/useNewsData'
import VideoCard from '@/components/videos/VideoCard'
import { getFeaturedImage, getYouTubeVideoId, stripHtml } from '@/lib/utils'
import { Container } from 'react-bootstrap'
export default function Page() {
  const { videos, videosLoading } = useNewsData()
  return (
    <Container className='igihe-videos py-4'>
      <HeaderDivider title="Latest Videos" />
      <div className="video-container d-grid pt-4">
        {
          videosLoading ? (
            <p>Loading...</p>
          ) : videos && videos.length > 0 ? (
            videos.map((video: any) => (
              <VideoCard
                key={video.id}
                thumbNail={getFeaturedImage(video) || '/default-thumb.jpg'}
                title={stripHtml(video?.title?.rendered )|| 'Untitled Video'}
                slug={video?.slug || 'youtube-video'}
                videoId={getYouTubeVideoId(video?.acf?.igh_yt_video_url)}
              />
              
            ))
          ) : (
            <p>No videos available.</p>
          )
        }
        
      </div>
    </Container>
  )
}