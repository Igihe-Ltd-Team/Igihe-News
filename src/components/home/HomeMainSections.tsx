import React, { useMemo } from 'react'
import DynamicArticleCard from '../news/DynamicArticleCard'
import { OptimizedImage } from '../ui/OptimizedImage'
import { NewsItem } from '@/types/fetchData'
import HeaderDivider from '../HeaderDivider'
import TimeLine from '../ReUsable/TimeLine'
import NewsSkeleton from '../NewsSkeleton'
import AdManager from '../ads/AdManager'

interface ArticlesProps {
    articles: NewsItem[]
}

export default function HomeMainSections({ articles }: ArticlesProps) {
    const { mainArticle, timeLineNews, asideNews } = useMemo(() => ({
        mainArticle: articles[0],
        timeLineNews: articles.slice(1, 5),
        asideNews: articles.slice(5, 7)
    }), [articles])

    if (!articles?.length) {
        return <NewsSkeleton/>
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
                    
                    {asideNews.map((article) => (
                        <DynamicArticleCard 
                            key={article.id || article.slug}
                            article={article}
                            bottomBorder 
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}