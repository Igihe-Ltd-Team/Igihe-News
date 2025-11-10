'use client'

import React from 'react'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
// import { ShareIcon } from '@/components/ui/Icons'
// import { useUIStore } from '@/stores/uiStore'
import { formatDate, getCategoryName, getFeaturedImage, stripHtml } from '@/lib/utils'
import { NewsItem } from '@/types/fetchData'
import { ThemedText } from '../ThemedText'
import Link from 'next/link'

interface ArticleCardProps {
  article: NewsItem
  priority?: boolean
  variant?: 'default' | 'featured' | 'compact'
  className?: string,
  showHeader?: boolean,
  showExpt?: boolean,
  showImage?: boolean,
  bottomBorder?: boolean,
  isTimeLine?: boolean,
  imgHeight?: number,
  bgColor?: string,
  bordered?: boolean,
  titleStyle?: 'small' | 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'defaultItalic' | 'smallBold' | 'size20' | 'italic18',
  showDate?: boolean,
  numbers?: string,
  leftNumber?: string
}



function DynamicArticleCard({
  article,
  titleStyle = 'default',
  className,
  showHeader = false,
  showImage = false,
  bottomBorder = false,
  isTimeLine = false,
  imgHeight,
  bgColor,
  bordered,
  showExpt,
  showDate = true,
  numbers,
  leftNumber
}: ArticleCardProps) {

  const featuredImage = getFeaturedImage(article);
  return (
    <div className={`my-2 position-relative ${className}`} style={{
      backgroundColor: bgColor ? bgColor : 'transparent',
      borderWidth: bordered ? '1px' : '0',
      borderStyle: 'solid',
      borderColor: '#0000001A'
    }}>
      {
        showImage &&
        <Link
          href={`/news/${article.slug}`}
          className="text-decoration-none text-reset"
          style={{flex:1}}
        >
          <OptimizedImage
            src={featuredImage || '/images/placeholder.jpg'}
            alt={article.title.rendered}
            fill
            height={imgHeight}
            className="object-cover"
          />
        </Link>
      }
      <div className='d-flex align-items-center gap-2' style={{flex:2}}>
        {
          leftNumber &&
          <div className='rounded-circle p-2' style={{ backgroundColor: '#F0F0F0' }}>
            <ThemedText type='italic18'>{leftNumber}</ThemedText>
          </div>
        }

        <div
          className={`py-2 ${isTimeLine && 'ps-4'}`}
          style={{
            borderBottomWidth: bottomBorder ? '1px' : '0',
            borderBottomStyle: 'solid',
            borderColor: '#F0F0F0',
            padding: bordered ? 20 : 0
          }}
        >
          {
            isTimeLine &&
            <div
              className="position-absolute rounded-circle bg-white timeLine-pointer"></div>
          }

          {
            showDate &&
            <div className="mb-2">
              <small style={{ color: '#999' }}>
                <ThemedText className="me-3" type='small'>
                  {
                    formatDate(article.date)
                  }
                </ThemedText>
                <ThemedText type='small'>{getCategoryName(article)}</ThemedText>
              </small>
            </div>
          }
          <Link
            href={`/news/${article.slug}`}
            className="text-decoration-none text-reset"
          >
            <div className='d-flex'>
              <ThemedText type={titleStyle}>
                {stripHtml(article.title.rendered)}
              </ThemedText>
              {
                numbers &&
                <div className='border-start p-2 m-2' style={{ height: '45%' }}>
                  <ThemedText type='italic34'>
                    {numbers}
                  </ThemedText>
                </div>
              }
            </div>
            {
              showExpt &&
              <div className='pt-3'>
                <ThemedText type='small' className='line-clamp-3'>
                  {stripHtml(article.excerpt?.rendered ?? '')}
                </ThemedText>
              </div>
            }
          </Link>

        </div>

      </div>

    </div>
  )
}

export default DynamicArticleCard