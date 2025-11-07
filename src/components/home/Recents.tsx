import React, { useMemo } from 'react'
import HeaderDivider from '../HeaderDivider'
import { NewsItem } from '@/types/fetchData'
import DynamicArticleCard from '../news/DynamicArticleCard'
import TimeLine from '../ReUsable/TimeLine'

interface RecentProps {
    latests?: NewsItem[]
    popular?: NewsItem[]
    featured?: NewsItem[]
    advertorials?: NewsItem[]
}

const NewsSection = React.memo(({ 
    title, 
    articles 
}: { 
    title: string
    articles?: NewsItem[] 
}) => {
    const { mainArticle, subArticles, listArticles } = useMemo(() => ({
        mainArticle: articles?.[0],
        subArticles: articles?.slice(1, 3) || [],
        listArticles: articles?.slice(0, 7) || []
    }), [articles])

    if (!articles?.length) return null

    return (
        <div className="col-xl-12 col-lg-12 col-md-12">
            <HeaderDivider title={title} />
            <div className="row g-3">
                <div className="col-xl-6 col-lg-6 col-md-6">
                    {mainArticle && (
                        <DynamicArticleCard
                            key={mainArticle.id || mainArticle.slug}
                            article={mainArticle}
                            showImage
                            priority={false} // Only first section should be priority
                            imgHeight={300}
                        />
                    )}
                    <div className="row g-2">
                        {subArticles.map(article => (
                            <div 
                                className="col-xl-6 col-lg-12 col-md-12" 
                                key={article.id || article.slug}
                            >
                                <DynamicArticleCard
                                    article={article}
                                    showImage
                                    priority={false}
                                    imgHeight={140}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-xl-6 col-lg-6 col-md-6">
                    {listArticles.map(article => (
                        <DynamicArticleCard
                            key={article.id || article.slug}
                            article={article}
                            bottomBorder
                            priority={false}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
})

NewsSection.displayName = 'NewsSection'

export default function Recents({ latests, featured, popular }: RecentProps) {
    const {
        latestsSidebar,
        featuredMain,
        featuredTimeline
    } = useMemo(() => ({
        latestsSidebar: latests?.slice(0, 5) || [],
        featuredMain: featured?.[0],
        featuredTimeline: featured?.slice(1, 9) || []
    }), [latests, featured])

    return (
        <div className="container p-2">
            <div className="row g-3">
                <div className="col-xl-8 col-lg-12">
                    <HeaderDivider title="Latest news" />
                    <div className="row g-3">
                        <div className="col-xl-4 col-lg-6 col-md-6">
                            <div className="py-4">
                                {latestsSidebar.map(article => (
                                    <DynamicArticleCard
                                        key={article.id || article.slug}
                                        article={article}
                                        showImage
                                        priority={false}
                                        imgHeight={143}
                                        bgColor="#1176BB08"
                                        bordered
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="col-xl-8 col-lg-6 col-md-6">
                            <div className="py-4">
                                {featuredMain && (
                                    <DynamicArticleCard
                                        key={featuredMain.id || featuredMain.slug}
                                        article={featuredMain}
                                        showImage
                                        showHeader
                                        priority={true}
                                        imgHeight={321}
                                        bordered
                                        showExpt
                                        titleStyle={'subtitle'}
                                    />
                                )}
                            </div>
                            <div className="py-2">
                                <HeaderDivider title="Featured News" />
                                <TimeLine articles={featuredTimeline} />
                            </div>
                        </div>
                    </div>
                    <NewsSection title="Great Lakes Region" articles={featured} />
                    <NewsSection title="Entertainment" articles={featured} />
                    <NewsSection title="Africa" articles={featured} />
                </div>

                <div className="col-xl-4 col-lg-12">
                    <HeaderDivider title="Popular News" />
                    {/* Add popular news content here */}
                </div>
            </div>
        </div>
    )
}