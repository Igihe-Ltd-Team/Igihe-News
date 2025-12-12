"use client"

import { useNewsData } from '@/hooks/useNewsData'
import React, { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import HeaderDivider from '../HeaderDivider'
import DynamicArticleCard from '../news/DynamicArticleCard'
import NewsSkeleton from '../NewsSkeleton'
import { useResponsive } from '@/hooks/useResponsive'

interface ArticleListProps {
    categoryId?: number,
    categoryName?:string
    categorySlug?:string
}
export default function NewsByCategory({ categoryId,categoryName,categorySlug }: ArticleListProps) {
    const { isMobile, isTablet, deviceType, width } = useResponsive()
    const { inView } = useInView()
    const { useCategoryArticles } = useNewsData()

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useCategoryArticles(categoryId)

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])
    const allArticles = data?.pages.flatMap(page => page.data) || []
    
    // if (!allArticles?.length) {
    //         return <NewsSkeleton/>
    //     }
    return (
        <div>
            <HeaderDivider title={categoryName} titleStyle={'size20'} slug={categorySlug}/>
            {allArticles.slice(0, 1).map((article, index) => (
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
             {allArticles.slice(1, 4).map((article, index) => (
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
        </div>
    )
}
