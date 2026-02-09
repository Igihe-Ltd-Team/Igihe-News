"use client"
import { useResponsive } from '@/hooks/useResponsive'
import React from 'react'
import DynamicArticleCard from '../news/DynamicArticleCard'
import { NewsItem } from '@/types/fetchData'

interface CategoryNewsProps {
    articles: NewsItem[]
}

function ClientCategoryData({ articles }: CategoryNewsProps) {

    const { isMobile, isTablet, deviceType, width } = useResponsive()

    return (
        <>

            {articles.slice(0, 1).map((article, index) => (
                <DynamicArticleCard
                    key={index}
                    article={article}
                    showImage
                    showHeader
                    priority
                    imgHeight={isMobile ? 250 : 185}
                    titleStyle={'defaultSemiBold'}
                    bottomBorder
                />
            ))}
            <div className='py-2'>
                {articles.slice(1, 4).map((article, index) => (
                    <DynamicArticleCard
                        key={index}
                        article={article}
                        priority
                        bottomBorder
                        showImage={isMobile}
                        imgHeight={80}
                        className='d-flex flex-row gap-3'

                    />
                ))}
            </div>
        </>
    )
}

export default ClientCategoryData