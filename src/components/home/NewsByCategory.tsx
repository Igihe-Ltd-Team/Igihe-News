import { useNewsData } from '@/hooks/useNewsData'
import React, { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import HeaderDivider from '../HeaderDivider'
import DynamicArticleCard from '../news/DynamicArticleCard'
import NewsSkeleton from '../NewsSkeleton'

interface ArticleListProps {
    categoryId?: number,
    categoryName?:string
}
export default function NewsByCategory({ categoryId,categoryName }: ArticleListProps) {
    const { ref, inView } = useInView()
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
    
    if (!allArticles?.length) {
            return <NewsSkeleton/>
        }
    return (
        <div>
            <HeaderDivider title={categoryName} titleStyle={'size20'}/>
            {allArticles.slice(0, 1).map((article, index) => (
                <DynamicArticleCard
                    key={index}
                    article={article}
                    showImage
                    showHeader
                    priority
                    imgHeight={185}
                    titleStyle={'defaultSemiBold'}
                />
            ))}
            <div className='py-2'>
             {allArticles.slice(1, 4).map((article, index) => (
                <DynamicArticleCard
                    key={index}
                    article={article}
                    priority
                />
            ))}
        </div>
        </div>
    )
}
