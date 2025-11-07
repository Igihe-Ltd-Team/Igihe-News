'use client'

import { NewsItem } from '@/types/fetchData'
import { OptimizedImage } from '../ui/OptimizedImage'
import { PlayIcon } from '../ui/Icons'
import { Skeleton } from '../ui/LoadingSpinner'

interface VideoSectionProps {
  videos: NewsItem[]
  loading?: boolean
}

export function VideoSection({ videos, loading }: VideoSectionProps) {
  if (loading) {
    return <Skeleton/>
  }

  if (!videos || videos.length === 0) {
    return null
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Latest Videos
        </h2>
        <a 
          href="/videos" 
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          View All Videos
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.slice(0, 6).map((video) => (
          <article 
            key={video.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <a href={`/videos/${video.slug}`} className="block">
              <div className="relative aspect-video">
                <OptimizedImage
                  src={video._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/placeholder.jpg'}
                  alt={video.title.rendered}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-3 transform hover:scale-110 transition-transform duration-200">
                    <PlayIcon className="w-6 h-6 text-gray-900" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h3 className="text-white font-semibold line-clamp-2">
                    {video.title.rendered}
                  </h3>
                </div>
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}