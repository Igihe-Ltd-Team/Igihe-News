import React, { Suspense, useMemo } from 'react'
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
// import Videos from './Videos'
// import Opinios from './Opinion'
// import RandomCard from './RandomCard'

const Videos = React.lazy(() => import('./Videos'))
const Opinios = React.lazy(() => import('./Opinion'))
const RandomCard = React.lazy(() => import('./RandomCard'))


interface RecentProps {
    latests?: NewsItem[]
    popular?: NewsItem[]
    featured?: NewsItem[]
    africaArticles?: NewsItem[]
    entertainment?: NewsItem[]
    advertorial?: NewsItem[]
    announcement?: NewsItem[]
}

const NewsSection = React.memo(({
    title,
    articles
}: {
    title: string
    articles?: NewsItem[]
}) => {

    const { isMobile } = useResponsive()
    const safeArticles = Array.isArray(articles) ? articles : [];
    const { mainArticle, subArticles, listArticles } = useMemo(() => ({
        mainArticle: safeArticles?.[0],
        subArticles: safeArticles?.slice(1, 3) || [],
        listArticles: safeArticles?.slice(3, 7) || []
    }), [safeArticles])


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
                                    showCategorie={false}
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

export default function Recents({ latests, featured, popular, africaArticles, entertainment, advertorial, announcement }: RecentProps) {

    const safeLatests = Array.isArray(latests) ? latests : [];
    const safeFeatured = Array.isArray(featured) ? featured : [];

    const {
        mainLatest,
        latestsSidebar,
        featuredTimeline
    } = useMemo(() => ({
        mainLatest: safeLatests?.[0],
        latestsSidebar: safeLatests?.slice(1, 6) || [],
        featuredTimeline: safeFeatured?.slice(0, 9) || [],
    }), [safeLatests, safeFeatured])

    // if (!latestsSidebar?.length) {
    //     return <NewsSkeleton />
    // }

    return (
        <div className="container p-2">
            <div className="row g-3">
                <div className="col-xl-8 col-lg-12">
                    <HeaderDivider title="Latest news" />
                    <div className="row g-3">
                        <div className="col-xl-4 col-lg-6 col-md-6">
                            <div className="row">
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
                            <div className="">
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

                    <Row className='pt-4'>
                        <Col>
                            <AdManager
                                position="bellow-featured-news"
                                priority={true}
                                className="mb-2"
                            /></Col>
                    </Row>
                    <NewsSection title="Africa" articles={africaArticles} />

                    <Suspense fallback={<NewsSkeleton count={3} />}>
                        <Videos />
                    </Suspense>
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
                    {/* <NewsSection title="Africa" articles={featured} /> */}
                </div>

                <div className="col-xl-4 col-lg-12">
                    <Suspense fallback={<NewsSkeleton count={1}/>}>
                        <PopularNews articles={popular || []} name='Popular News' />
                    </Suspense>
                    <div className='pt-2'>
                        <SectionWithToggle
                            title='Advertorials'
                            articles={advertorial}
                            showImgs
                            showDate
                            titleBG='#1176BB'
                        />
                    </div>
                    <div className='pt-3'>
                        <SectionWithToggle title='Announcements' articles={announcement} titleBG='#282F2F' />
                    </div>
                    <div className='mt-3 p-2' style={{ backgroundColor: '#f5f5f5' }}>
                        <ThemedText className='d-flex justify-content-center' type='small'>Advertisement</ThemedText>
                        <AdManager
                            position="home-section-1"
                            priority={true}
                            className="mb-2"
                        />
                    </div>
                    <div className='pt-3'>
                        <Suspense fallback={<NewsSkeleton count={1} />}>
                            <Opinios />
                        </Suspense>
                    </div>
                    <AdManager
                        position="home-section-1"
                        priority={true}
                        className="mb-2"
                    />
                    <div className='py-4'>
                        <Suspense fallback={null}>
                            <RandomCard />
                        </Suspense>
                    </div>
                    <AdManager
                        position="home-section-1"
                        priority={true}
                        className="mb-2"
                    />

                </div>
            </div>
        </div>
    )
}