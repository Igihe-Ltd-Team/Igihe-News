import React, { Suspense } from 'react'
import HeaderDivider from '../HeaderDivider'
import { NewsItem } from '@/types/fetchData'
import DynamicArticleCard from '../news/DynamicArticleCard'
import TimeLine from '../ReUsable/TimeLine'
import NewsSkeleton from '../NewsSkeleton'
import SectionWithToggle from '../ReUsable/SectionWithToggle'
import { ThemedText } from '../ThemedText'
import { Col, Row } from 'react-bootstrap'

import {
  getLatestArticles,
  getGreatLakesArticles,
  getEntertainmentArticles,
  getFeaturedAdvertorial,
  getFeaturedAnnouncement,
  getInternationalArticles,
  getMainFeatured,
  getOtherFeatured
} from './actions'
import ServerSlotManager from '../ads/ServerSlotManager'
import PopularNewsFetcher from './PopularNewsFetcher'

const Videos = React.lazy(() => import('./Videos'))
const Opinios = React.lazy(() => import('./Opinion'))
const RandomCard = React.lazy(() => import('./RandomCard'))

interface NewsSectionProps {
  title: string
  articles?: NewsItem[]
  isMobile: boolean
  slug?:string
}

async function NewsSection({ title, articles, isMobile,slug }: NewsSectionProps) {
  const safeArticles = Array.isArray(articles) ? articles : []
  const mainArticle = safeArticles?.[0]
  const subArticles = safeArticles?.slice(1, 3) || []
  const listArticles = safeArticles?.slice(3, 12) || []

  if (!articles?.length) return null

  return (
    <div className="col-xl-12 col-lg-12 col-md-12">
      <HeaderDivider title={title} slug={slug} />
      <div className="row g-3">
        <div className="col-xl-6 col-lg-6 col-md-6">
          {mainArticle && (
            <DynamicArticleCard
              key={mainArticle.id || mainArticle.slug}
              article={mainArticle}
              showImage
              priority={true}
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
              imgHeight={80}
              className='d-flex flex-row gap-3'
            />
          ))}
        </div>
      </div>
    </div>
  )
}

async function LatestFeaturedSection() {
  const [
    latests,
    mainFeatured,
    otherFeatured
  ] = await Promise.all([
    getLatestArticles(),
    getMainFeatured(),
    getOtherFeatured()
  ])

  return (
    <>
      <HeaderDivider title="Latest news" slug={'articles'} />
      <div className="row g-3">
        <div className="col-xl-4 col-lg-6 col-md-6">
          <div className="row">
            {latests.map(article => (
              <div className="col-xl-12 col-lg-6 col-md-12 col-sd-6 col-12" key={article.id || article.slug}>
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
            {mainFeatured?.[0] && (
              <DynamicArticleCard
                key={mainFeatured[0].id || mainFeatured[0].slug}
                article={mainFeatured[0]}
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
            <HeaderDivider title="Featured News" slug={'tag/72'} />
            <div>
              <TimeLine articles={otherFeatured || []} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

async function GreatLakesSection() {
  const articles = await getGreatLakesArticles()
  return <NewsSection title="Great Lakes Region" articles={articles} isMobile={false} slug={'tag/99'} />
}

async function EntertainmentSection() {
  const articles = await getEntertainmentArticles()
  return <NewsSection title="Entertainment" articles={articles} isMobile={false} slug={'entertainment'} />
}

async function InternationalSection() {
  const articles = await getInternationalArticles()
  return <NewsSection title="International" articles={articles} isMobile={false} slug={'tag/101'} />
}

async function AdvertorialsSection() {
  const advertorial = await getFeaturedAdvertorial()

  return (
    <SectionWithToggle
      title='Advertorials'
      articles={advertorial}
      showImgs
      showDate
      titleBG='#1176BB'
      slug={'advertorials'}
    />
  )
}

async function AnnouncementsSection() {
  const announcement = await getFeaturedAnnouncement()
  return <SectionWithToggle isFile={true} slug={'announcements'} title='Announcements' articles={announcement} titleBG='#282F2F' />
}

export default function Recents() {
  return (
    <div className="container p-2">
      <div className="row g-4">
        <div className="col-xl-8 col-lg-12 mt-0">
          <Suspense fallback={<NewsSkeleton count={3} />}>
            <LatestFeaturedSection />
          </Suspense>

          <Row className='pt-4'>
            <Col>
              <ServerSlotManager
                position="bellow-featured-news"
                priority={true}
                className="mb-2"
              />
            </Col>
          </Row>

          <Suspense fallback={<NewsSkeleton count={3} />}>
            <GreatLakesSection />
          </Suspense>

          <Suspense fallback={<NewsSkeleton count={3} />}>
            <Videos />
          </Suspense>

          <Row>
            <Col>
              <ServerSlotManager
                position="bellow-videos"
                priority={true}
                className="mb-2"
              />
            </Col>
          </Row>

          <Suspense fallback={<NewsSkeleton count={3} />}>
            <EntertainmentSection />
          </Suspense>

          <div className='mt-3 p-2' style={{ backgroundColor: '#f5f5f5' }}>
            <ThemedText className='d-flex justify-content-center' type='small'>Advertisement</ThemedText>
            <ServerSlotManager
              position="midle-large-size-add"
              priority={true}
              className="mb-2"
            />
          </div>

          <Suspense fallback={<NewsSkeleton count={3} />}>
            <InternationalSection />
          </Suspense>
        </div>

        <div className="col-xl-4 col-lg-4 mt-0">
          <PopularNewsFetcher />

          <div className='pt-2'>
            <Suspense fallback={<NewsSkeleton count={1} />}>
              <AdvertorialsSection />
            </Suspense>
          </div>

          <div className='pt-3'>
            <Suspense fallback={<NewsSkeleton count={1} />}>
              <AnnouncementsSection />
            </Suspense>
          </div>

          <div className='mt-3 p-2' style={{ backgroundColor: '#f5f5f5' }}>
            <ThemedText className='d-flex justify-content-center' type='small'>Advertisement</ThemedText>
            <ServerSlotManager
              position="after-announcements"
              priority={true}
              className="mb-2"
            />
          </div>

          <div className='pt-3'>
            <Suspense fallback={<NewsSkeleton count={1} />}>
              <Opinios />
            </Suspense>
          </div>

          <ServerSlotManager
            position="after-opinions"
            priority={true}
            className="mb-2"
          />

          <div className='py-4'>
            <Suspense fallback={null}>
              <RandomCard />
            </Suspense>
          </div>

          <ServerSlotManager
            position="after-facts"
            priority={true}
            className="mb-2"
          />
        </div>
      </div>
    </div>
  )
}
