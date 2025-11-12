import React, { useMemo } from 'react'
import DynamicArticleCard from '../news/DynamicArticleCard'
import { NewsItem } from '@/types/fetchData'
import TimeLine from '../ReUsable/TimeLine'
import NewsSkeleton from '../NewsSkeleton'
import AdManager from '../ads/AdManager'
import { useResponsive } from '@/hooks/useResponsive'
import SingleSkeleton from '../Loading/SingleSkeleton'

interface ArticlesProps {
    articles: NewsItem[]
}

export default function HomeMainSections({ articles }: ArticlesProps) {
    const { isMobile } = useResponsive()
    const { mainArticle, timeLineNews, asideNews } = useMemo(() => ({
        mainArticle: articles[0],
        timeLineNews: articles.slice(1, 5),
        asideNews: articles.slice(5, 7)
    }), [articles])

    if (!articles?.length) {
        return <SingleSkeleton/>
    }

    return (
        <div className="container p-2">
            <div className="row g-0">
                <div className="col-xl-6 col-lg-12">
                    {mainArticle && (
                        <DynamicArticleCard 
                            article={mainArticle} 
                            showImage 
                            showHeader 
                            priority
                            imgHeight={321}
                            titleStyle={'subtitle'}
                        />
                    )}
                </div>

                <div className="col-xl-3 col-lg-6 col-md-6 bg-white">
                    <TimeLine articles={timeLineNews}/>
                </div>

                <div className="col-xl-3 col-lg-6 col-md-6">
                    
                    <AdManager
                        position="home-section-1"
                        priority={true}
                        className="mb-2"
                    />
                    <div style={{paddingTop:isMobile?'15px':''}}>
                    {asideNews.map((article) => (
                        <DynamicArticleCard 
                            key={article.id || article.slug}
                            article={article}
                            bottomBorder 

                            showImage={isMobile}
                            imgHeight={40}
                            className='d-flex flex-row gap-3'
                        />
                    ))}
                    </div>
                </div>
            </div>
        </div>
    )
}