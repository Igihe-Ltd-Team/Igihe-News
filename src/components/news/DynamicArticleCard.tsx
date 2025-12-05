'use client'

import React from 'react'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { formatDate, getCategoryName, getCategorySlug, getFeaturedImage, stripHtml } from '@/lib/utils'
import { NewsItem } from '@/types/fetchData'
import { ThemedText } from '../ThemedText'
import Link from 'next/link'
import { useNewsData } from '@/hooks/useNewsData'
import { ApiService } from '@/services/apiService'

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
  leftNumber?: string,
  mobileImgHeight?: number
  showCategorie?:boolean
  isSlider?:boolean
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
  leftNumber,
  showCategorie = true,
  isSlider = false

}: ArticleCardProps) {

  const featuredImage = getFeaturedImage(article);

  const mouseEnter = (articles:NewsItem)=>{
    if (article?.slug) {
      ApiService.cacheArticles(articles)
    }
  }
      
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
          href={`/news/${getCategorySlug(article)}/${article.slug}`}
          className="text-decoration-none text-reset"
          style={
            isSlider ? { width:'20%' }:{ flex: 1 }
          }
          aria-label={`Read full article: ${stripHtml(article.title.rendered)}`}
          // prefetch={true}
          onMouseEnter={() => mouseEnter(article)}
        >
          <OptimizedImage
            src={featuredImage || '/images/placeholder.jpg'}
            alt={article.title.rendered}
            fill
            height={imgHeight}
            imgClass="object-fit-cover"
            className={bordered ? "":'mb-2'}
          />
        </Link>
      }
      <div className='d-flex align-items-center gap-2' style={{ flex: 2 }}>
        {
          leftNumber &&
          <div className='rounded-circle p-2' style={{ backgroundColor: '#F0F0F0' }}>
            <ThemedText type='italic18'>{leftNumber}</ThemedText>
          </div>
        }

        <div
          className={`${isTimeLine && 'ps-4'} ${(!bottomBorder && !bordered) && 'py-2'}`}
          style={{
            padding: bordered ? 20 : 0,
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
              <small className='d-flex' style={{ color: '#999' }}>
                <ThemedText className="me-3" type='small'>
                  {
                    formatDate(article.date)
                  }
                </ThemedText>
                {
                  showCategorie &&
                  <Link href={`/news/${getCategorySlug(article)}`}
                  className="text-decoration-none text-reset d-flex gap-1"
                  aria-label={`Read full article: ${getCategoryName(article)}`}
                  style={{flex:1}}
                >
                  <span className="d-flex flex-wrap align-items-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_1277_4757)">
                        <path d="M-7.82013e-05 4.08562C0.00609398 4.00223 0.0369568 3.93028 0.0630178 3.85832C0.355179 3.05469 0.820168 2.35664 1.41409 1.73794C1.80433 1.33108 2.23571 0.973315 2.74047 0.706335C3.3344 0.39228 3.97084 0.204653 4.63541 0.104451C5.05513 0.0412364 5.4776 -0.0071826 5.90349 0.000887394C6.83553 0.0176997 7.72573 0.205998 8.53226 0.680779C9.27226 1.11588 9.77086 1.73727 9.94643 2.57856C10.1131 3.37479 9.89088 4.05334 9.26472 4.59537C8.99793 4.82671 8.67902 4.94776 8.32651 4.98273C7.79637 5.03518 7.28269 4.97533 6.79781 4.74534C6.51388 4.61084 6.26561 4.42792 6.04135 4.21138C5.79719 3.976 5.56676 3.72718 5.29997 3.51535C4.83361 3.14413 4.29044 2.94171 3.7116 2.81931C3.05252 2.68011 2.3955 2.67405 1.74809 2.87984C1.06775 3.09638 0.507431 3.48508 0.0678177 4.03855C0.0534153 4.0567 0.043128 4.08091 -0.000764847 4.08629L-7.82013e-05 4.08562Z" fill="#A0A0A0" />
                      </g>
                      <g clipPath="url(#clip1_1277_4757)">
                        <path d="M10.0001 5.91438C9.99391 5.99777 9.96304 6.06972 9.93698 6.14168C9.64482 6.94531 9.17983 7.64336 8.58591 8.26206C8.19567 8.66892 7.76429 9.02668 7.25953 9.29367C6.6656 9.60772 6.02916 9.79535 5.36459 9.89555C4.94487 9.95876 4.5224 10.0072 4.09651 9.99911C3.16447 9.9823 2.27427 9.794 1.46774 9.31922C0.727738 8.88412 0.229144 8.26273 0.0535728 7.42144C-0.113082 6.62521 0.109125 5.94666 0.735282 5.40463C1.00207 5.17329 1.32098 5.05224 1.67349 5.01727C2.20363 4.96482 2.71731 5.02467 3.20219 5.25466C3.48612 5.38916 3.73439 5.57208 3.95865 5.78862C4.20281 6.024 4.43324 6.27282 4.70003 6.48465C5.16639 6.85587 5.70956 7.05829 6.2884 7.18069C6.94748 7.31989 7.6045 7.32595 8.25191 7.12016C8.93225 6.90362 9.49257 6.51492 9.93218 5.96145C9.94658 5.9433 9.95687 5.91909 10.0008 5.91371L10.0001 5.91438Z" fill="#A0A0A0" />
                      </g>
                      <defs>
                        <clipPath id="clip0_1277_4757">
                          <rect width="10" height="5" fill="white" transform="matrix(-1 0 0 -1 10 5)" />
                        </clipPath>
                        <clipPath id="clip1_1277_4757">
                          <rect width="10" height="5" fill="white" transform="translate(0 5)" />
                        </clipPath>
                      </defs>
                    </svg>
                  </span>
                  <ThemedText type='small'>{getCategoryName(article)}</ThemedText>
                </Link>
                }
                
              </small>
            </div>
          }
          <div style={{
            borderBottomWidth: bottomBorder ? '1px' : '0',
            borderBottomStyle: 'solid',
            borderColor: '#F0F0F0',
            paddingBottom: bottomBorder ? 10: 0
          }}>

          <Link
            href={`/news/${getCategorySlug(article)}/${article.slug}`}
            className="text-decoration-none text-reset"
            aria-label={`Read full article: ${stripHtml(article.title.rendered)}`}
            onMouseEnter={() => mouseEnter(article)}
          >
            <div className='d-flex'>
              <ThemedText type={showExpt ? showHeader ? titleStyle : 'defaultSemiBold' : titleStyle} className={isSlider ? 'line-clamp-2':''}>
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

    </div>
  )
}

export default DynamicArticleCard