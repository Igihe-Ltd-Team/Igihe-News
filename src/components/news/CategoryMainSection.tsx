import React, { useMemo } from 'react'
import DynamicArticleCard from '../news/DynamicArticleCard'
import { OptimizedImage } from '../ui/OptimizedImage'
import { NewsItem } from '@/types/fetchData'
import HeaderDivider from '../HeaderDivider'
import TimeLine from '../ReUsable/TimeLine'
import NewsSkeleton from '../NewsSkeleton'

interface ArticlesProps {
    articles: NewsItem[]
}

export default function CategoryMainSection({ articles }: ArticlesProps) {

    const safeArticles = Array.isArray(articles) ? articles : [];
    
        const { mainArticle, timeLineNews } = useMemo(() => ({
            mainArticle: safeArticles?.[0],
            timeLineNews: safeArticles.slice(1, 7)
        }), [safeArticles])


    if (!safeArticles?.length) {
        return <></>
    }

    return (
        <div className="container p-2">
            <div className="row g-0">
                <div className={`${safeArticles?.length > 1 ? 'col-xl-7':'col-xl-12'} col-xl-7 col-lg-12`}>
                    {mainArticle && (
                        <DynamicArticleCard 
                            article={mainArticle} 
                            showImage 
                            showHeader 
                            priority
                            imgHeight={safeArticles?.length > 1 ? 370 : 600}
                            titleStyle={'subtitle'}
                            showExpt={safeArticles?.length  === 1}
                        />
                    )}
                </div>

                <div className="col-xl-5 col-lg-6 col-md-6">
                    <TimeLine articles={timeLineNews}/>
                </div>
            </div>
        </div>
    )
}