import React, { useMemo } from 'react'
import HeaderDivider from '../HeaderDivider'
import { NewsItem } from '@/types/fetchData'
import DynamicArticleCard from '../news/DynamicArticleCard'
import TimeLine from '../ReUsable/TimeLine'
import NewsSkeleton from '../NewsSkeleton'
import SectionWithToggle from '../ReUsable/SectionWithToggle'
import { OptimizedImage } from '../ui/OptimizedImage'
import { ThemedText } from '../ThemedText'
import { Col, Row } from 'react-bootstrap'
import AdManager from '../ads/AdManager'
import { useResponsive } from '@/hooks/useResponsive'
import PopularNews from '../news/PopularNews'

interface RecentProps {
    latests?: NewsItem[]
    popular?: NewsItem[]
    featured?: NewsItem[]
    advertorials?: NewsItem[]
    africaArticles?:NewsItem[]
    entertainment?:NewsItem[]
}

const NewsSection = React.memo(({
    title,
    articles
}: {
    title: string
    articles?: NewsItem[]
}) => {

    const { isMobile } = useResponsive()
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
                            priority={false}
                            imgHeight={300}
                        />
                    )}
                    <div className="row g-2">
                        {subArticles.map(article => (
                            <div
                                className="col-xl-6 col-lg-6 col-md-6 col-6"
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

                            showImage={isMobile}
                            imgHeight={40}
                            className='d-flex flex-row gap-3'
                        />
                    ))}
                </div>
            </div>
        </div>
    )
})

NewsSection.displayName = 'NewsSection'

export default function Recents({ latests, featured, popular,africaArticles,entertainment }: RecentProps) {
    const {
        mainLatest,
        latestsSidebar,
        // featuredMain,
        featuredTimeline
    } = useMemo(() => ({
        mainLatest:latests?.[0],
        latestsSidebar: latests?.slice(1, 6) || [],
        // featuredMain: featured?.[0],
        featuredTimeline: featured?.slice(0, 9) || [],
    }), [latests, featured])

    if (!latestsSidebar?.length) {
        return <NewsSkeleton />
    }


    return (
        <div className="container p-2">
            <div className="row g-3">
                <div className="col-xl-8 col-lg-12">
                    <HeaderDivider title="Latest news" />
                    <div className="row g-3">
                        <div className="col-xl-4 col-lg-6 col-md-6">
                            <div className="py-4 row">
                                {latestsSidebar.map(article => (
                                    <div className="col-xl-12 col-lg-6 col-md-6 col-sd-6 col-6" key={article.id || article.slug}>
                                        <DynamicArticleCard
                                            article={article}
                                            showImage
                                            priority={false}
                                            imgHeight={143}
                                            bgColor="#1176BB08"
                                            bordered
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="col-xl-8 col-lg-6 col-md-6">
                            <div className="py-4">
                                {mainLatest && (
                                    <DynamicArticleCard
                                        key={mainLatest.id || mainLatest.slug}
                                        article={mainLatest}
                                        showImage
                                        showHeader
                                        priority={true}
                                        imgHeight={321}
                                        bordered
                                        showExpt
                                        titleStyle={'size20'}
                                    />
                                )}
                            </div>
                            <div className="py-2">
                                <HeaderDivider title="Featured News" />
                                <div>
                                    <TimeLine articles={featuredTimeline} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Row>
                        <Col>
                            <AdManager
                                position="header-landscape-ad-2"
                                priority={true}
                                className="mb-2"
                            /></Col>
                    </Row>
                    <NewsSection title="Great Lakes Region" articles={africaArticles} />
                    <Row>
                        <Col>
                            <AdManager
                                position="header-landscape-ad-1"
                                priority={true}
                                className="mb-2"
                            /></Col>
                    </Row>
                    <NewsSection title="Entertainment" articles={entertainment} />
                    <div className='mt-3 p-2' style={{ backgroundColor: '#f5f5f5' }}>
                        <ThemedText className='d-flex justify-content-center' type='small'>Advertisement</ThemedText>
                        <AdManager
                            position="home-after-highlights"
                            priority={true}
                            className="mb-2"
                        />
                    </div>
                    <NewsSection title="Africa" articles={featured} />
                </div>

                <div className="col-xl-4 col-lg-12">
                    <PopularNews articles={popular || []} name='Popular News'/>
                    <div className='pt-2'>
                        <SectionWithToggle title='Advertorials' showImgs showDate titleBG='#1176BB' />
                    </div>
                    <div className='pt-3'>
                        <SectionWithToggle title='Announcements' titleBG='#282F2F' />
                    </div>
                    <div className='mt-3 p-2' style={{ backgroundColor: '#f5f5f5' }}>
                        <ThemedText className='d-flex justify-content-center' type='small'>Advertisement</ThemedText>
                        <OptimizedImage
                            src="https://new.igihe.com/wp-content/uploads/2025/06/ca68c8f5595ed47529d84f21ab560f08e700bd97-1.gif"
                            alt="Featured content"
                            fill
                            height={290}
                            className="object-cover"
                        />
                    </div>
                    <div className='pt-3'>
                        <HeaderDivider title="Opinions" />
                    </div>
                </div>
            </div>
        </div>
    )
}