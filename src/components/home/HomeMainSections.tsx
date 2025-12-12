import React, { useMemo } from 'react'
import DynamicArticleCard from '../news/DynamicArticleCard'
import { NewsItem } from '@/types/fetchData'
import TimeLine from '../ReUsable/TimeLine'
import NewsSkeleton from '../NewsSkeleton'
import AdManager from '../ads/AdManager'
import { useResponsive } from '@/hooks/useResponsive'
import SingleSkeleton from '../Loading/SingleSkeleton'
import { useFeaturedArticles } from '@/hooks/useMainNewsData'

interface ArticlesProps {
    articles: NewsItem[]
}

export default function HomeMainSections() {
    const { isMobile } = useResponsive()
    const { data: articles = [], isLoading:articlesLoading, error } = useFeaturedArticles()
    const { data: mainArticle = [], isLoading:mainNewsLoading } = useFeaturedArticles()

    const safeArticles = Array.isArray(articles) ? articles : [];

    const {  timeLineNews, asideNews } = useMemo(() => ({
        timeLineNews: safeArticles.slice(0, 5),
        asideNews: safeArticles.slice(5, 7)
    }), [safeArticles])

    if (!articles?.length) {
        return <SingleSkeleton/>
    }

    return (
        <div className="container p-2">
            <div className="row g-0">
                <div className="col-xl-6 col-lg-12">
                    {mainArticle && (
                        <DynamicArticleCard 
                            article={mainArticle[0]} 
                            showImage 
                            showHeader 
                            priority
                            imgHeight={321}
                            titleStyle={'subtitle'}
                        />
                    )}
                </div>

                <div className="col-xl-3 col-lg-6 col-md-6">
                    <TimeLine articles={timeLineNews}/>
                </div>

                <div className="col-xl-3 col-lg-6 col-md-6">
                    
                    <AdManager
                        position="home-after-highlights"
                        priority={true}
                        className="mb-2"
                    />
                    <div style={{paddingTop:isMobile?'15px':''}}>
                    {asideNews.map((article) => (
                        <DynamicArticleCard 
                            key={article.id || article.slug}
                            article={article}
                            bottomBorder 
                            isSlider
                            showImage={isMobile}
                            imgHeight={80}
                            className='d-flex flex-row gap-3'
                        />
                    ))}
                    </div>
                </div>
            </div>
        </div>
    )
}