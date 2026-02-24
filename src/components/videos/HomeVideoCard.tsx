import React from 'react'
import Image from 'next/image'
import { NewsItem } from '@/types/fetchData'
import { getFeaturedImage, stripHtml } from '@/lib/utils'
import { OptimizedImage } from '../ui/OptimizedImage'
import { ThemedText } from '../ThemedText'

interface VideoProps {
  article: NewsItem
}
export default function HomeVideoCard({ article }: VideoProps) {
  return (
    <div className="video-card-home">
      <div className="video-thumbnail" style={{flex:1}}>
        <OptimizedImage
          src={getFeaturedImage(article) || '/assets/igiheIcon.png'}
          alt={article?.title?.rendered}
          fill
          height={200}
          imgClass="object-fit-cover" />


        {/* <Image src={getFeaturedImage(article) || '/assets/igiheIcon.png' } alt="Video thumbnail 1" width="300" height="169" 
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R"
        /> */}
      </div>
      <div className="card-details">
        <a href={`/videos/${article.slug}`} className="text-decoration-none">
          <span className="play-icon">

            <svg width="32" height="33" viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <g clipPath="url(#clip0_1216_2598)">
                <path d="M16 31.43C24.4831 31.43 31.36 24.5531 31.36 16.07C31.36 7.58687 24.4831 0.709961 16 0.709961C7.51691 0.709961 0.639999 7.58687 0.639999 16.07C0.639999 24.5531 7.51691 31.43 16 31.43Z" fill="white" />
                <path d="M16 0.0700684C7.168 0.0700684 0 7.23807 0 16.0701C0 24.9021 7.168 32.0701 16 32.0701C24.832 32.0701 32 24.9021 32 16.0701C32 7.23807 24.832 0.0700684 16 0.0700684Z" fill="#EE0120" />
                <path d="M11.52 23.2701V8.87012L21.12 16.0701L11.52 23.2701Z" fill="white" />
              </g>
              <defs>
                <clipPath id="clip0_1216_2598">
                  <rect width="32" height="32" fill="white" transform="translate(0 0.0700684)" />
                </clipPath>
              </defs>
            </svg>
          </span>
          <ThemedText className='heading-title'>{stripHtml(article.title.rendered)}</ThemedText>
          {/* <p className="heading-title">Ingabire Victoire yageze mu Rukiko…</p> */}
        </a>

      </div>
    </div>
  )
}