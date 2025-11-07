'use client'

import React from 'react'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { ShareIcon } from '@/components/ui/Icons'
import { useUIStore } from '@/stores/uiStore'
import { cn, formatDate, getCategoryName, getFeaturedImage, stripHtml } from '@/lib/utils'
import { NewsItem } from '@/types/fetchData'
import { ThemedText } from '../ThemedText'

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
  imgHeight?:number,
  bgColor?:string,
  bordered?:boolean,
  titleStyle?:'small' | 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'defaultItalic' | 'smallBold'
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
  showExpt
}: ArticleCardProps) {

  const featuredImage = getFeaturedImage(article);
  return (
    <div className={`my-2 position-relative ${className}`} style={{
      backgroundColor: bgColor ? bgColor:'transparent',
      borderWidth:bordered? '1px':'0',
      borderStyle:'solid',
      borderColor:'#0000001A'
      }}>
      {
        showImage &&
        <OptimizedImage
            src={featuredImage || '/images/placeholder.jpg'}
            alt={article.title.rendered}
            fill
            height={imgHeight}
            className="object-cover"
          />
      }
      <div 
        className={`py-2 ${isTimeLine && 'ps-4'}`} 
        style={{ 
          borderBottomWidth: bottomBorder ? '1px' : '0', 
          borderBottomStyle:'solid',
          borderColor: '#F0F0F0',
          padding:bordered ? 20:0
        }}
      >
        {
          isTimeLine &&
          <div
            className="position-absolute rounded-circle bg-white timeLine-pointer"
          ></div>
        }

          <div className="mb-2">
            <small style={{ color: '#999' }}>
              <ThemedText className="me-3" type='small'>19 mins ago</ThemedText>
              <ThemedText type='small'>{getCategoryName(article)}</ThemedText>
            </small>
          </div>
          <ThemedText type={titleStyle}>
            {stripHtml(article.title.rendered)}
          </ThemedText>
          {
            showExpt &&
            <div>
          <ThemedText type='small'>
            {stripHtml(article.excerpt.rendered)}
          </ThemedText>
          </div>
          }
        
      </div>
    </div>
  )
}

export default DynamicArticleCard