import React, { useMemo } from 'react'
import DynamicArticleCard from '../news/DynamicArticleCard'
import { OptimizedImage } from '../ui/OptimizedImage'
import { NewsItem } from '@/types/fetchData'
import HeaderDivider from '../HeaderDivider'
import TimeLine from '../ReUsable/TimeLine'

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
        return null
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
                    <OptimizedImage
                        src="https://new.igihe.com/wp-content/uploads/2025/06/ca68c8f5595ed47529d84f21ab560f08e700bd97-1.gif"
                        alt="Featured content"
                        fill
                        height={207}
                        className="object-cover"
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