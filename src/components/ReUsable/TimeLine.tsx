"use client"

import React from 'react'
import DynamicArticleCard from '../news/DynamicArticleCard'
import { NewsItem } from '@/types/fetchData'
import { useResponsive } from '@/hooks/useResponsive'

interface TimeLineProps {
    articles: NewsItem[]
}
export default function TimeLine({ articles }: TimeLineProps) {
    const { isMobile } = useResponsive()
    return (
        <div className={`position-relative ${!isMobile ?'px-4':''}`}>
            <div className={`position-absolute ${!isMobile ?'timeLine-line':''}`} />

            {articles.map((item) => (
                <DynamicArticleCard
                    key={item.id || item.slug}
                    isTimeLine={!isMobile}
                    isSlider={isMobile}
                    article={item}
                    bottomBorder
                    imgHeight={isMobile ? 80 : undefined}
                    className={isMobile ?'d-flex flex-row gap-3':'timeLine-item'}
                />
                                                
            ))}
        </div>
    )
}
