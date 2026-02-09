// "use client"

// import React, { Suspense, useMemo } from 'react'
// import HeaderDivider from '../HeaderDivider'
// import { NewsItem } from '@/types/fetchData'
// import DynamicArticleCard from '../news/DynamicArticleCard'
// import TimeLine from '../ReUsable/TimeLine'
// import NewsSkeleton from '../NewsSkeleton'
// import SectionWithToggle from '../ReUsable/SectionWithToggle'
// import { OptimizedImage } from '../ui/OptimizedImage'
// import { ThemedText } from '../ThemedText'
// import { Col, Row } from 'react-bootstrap'
// import { useResponsive } from '@/hooks/useResponsive'
// import PopularNews from '../news/PopularNews'

// import {
//   useLatestArticles,
//   usePopularArticles,
//   useHighlightArticles,
//   useAfricaArticles,
//   useEntertainmentArticles,
//   useFeaturedAdvertorial,
//   useFeaturedAnnouncement,
//   useInternationalArticles
// } from '@/hooks/useMainNewsData'
// import AdManager from '../ads/AdManager'


// const Videos = React.lazy(() => import('./Videos'))
// const Opinios = React.lazy(() => import('./Opinion'))
// const RandomCard = React.lazy(() => import('./RandomCard'))


// interface RecentProps {
//     latests?: NewsItem[]
//     popular?: NewsItem[]
//     featured?: NewsItem[]
//     africaArticles?: NewsItem[]
//     entertainment?: NewsItem[]
//     advertorial?: NewsItem[]
//     announcement?: NewsItem[]
// }

// const NewsSection = React.memo(({
//     title,
//     articles
// }: {
//     title: string
//     articles?: NewsItem[]
// }) => {

//     const { isMobile } = useResponsive()
//     const safeArticles = Array.isArray(articles) ? articles : [];
//     const { mainArticle, subArticles, listArticles } = useMemo(() => ({
//         mainArticle: safeArticles?.[0],
//         subArticles: safeArticles?.slice(1, 3) || [],
//         listArticles: safeArticles?.slice(3, 12) || []
//     }), [safeArticles])


//     if (!articles?.length) return null

//     return (
//         <div className="col-xl-12 col-lg-12 col-md-12">
//             <HeaderDivider title={title} />
//             <div className="row g-3">
//                 <div className="col-xl-6 col-lg-6 col-md-6">
//                     {mainArticle && (
//                         <DynamicArticleCard
//                             key={mainArticle.id || mainArticle.slug}
//                             article={mainArticle}
//                             showImage
//                             priority={true}
//                             imgHeight={300}
//                         />
//                     )}
//                     <div className="row g-2">
//                         {subArticles.map(article => (
//                             <div
//                                 className="col-xl-6 col-lg-6 col-md-6 col-6"
//                                 key={article.id || article.slug}
//                             >
//                                 <DynamicArticleCard
//                                     article={article}
//                                     showImage
//                                     priority={false}
                                
//                                     imgHeight={140}
//                                     showCategorie={false}
//                                 />
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//                 <div className="col-xl-6 col-lg-6 col-md-6">
//                     {listArticles.map(article => (
//                         <DynamicArticleCard
//                             key={article.id || article.slug}
//                             article={article}
//                             bottomBorder
//                             priority={false}

//                             showImage={isMobile}
//                             imgHeight={80}
//                             className='d-flex flex-row gap-3'
//                         />
//                     ))}
//                 </div>
//             </div>
//         </div>
//     )
// })

// NewsSection.displayName = 'NewsSection'

// export default function Recents() {
//     const { isMobile } = useResponsive()


//     const { data: latests = [] } = useLatestArticles()
//     const { data: popular = [] } = usePopularArticles()
//     const { data: featured = [] } = useHighlightArticles()
//     const { data: africaArticles = [] } = useAfricaArticles()
//     const { data: internationalArticles = [] } = useInternationalArticles()
//     const { data: entertainment = [] } = useEntertainmentArticles()
//     const { data: advertorial = [] } = useFeaturedAdvertorial()
//     const { data: announcement = [] } = useFeaturedAnnouncement()


//     const safeLatests = Array.isArray(latests) ? latests : [];
//     const safeFeatured = Array.isArray(featured) ? featured : [];

//     const {
//         mainLatest,
//         latestsSidebar
//     } = useMemo(() => ({
//         mainLatest: safeLatests?.[0],
//         latestsSidebar: safeLatests?.slice(1, 6) || []
//     }), [safeLatests, safeFeatured])

//     // if (!latestsSidebar?.length) {
//     //     return <NewsSkeleton />
//     // }

//     return (
//         <div className="container p-2">
//             <div className="row g-4">
//                 <div className="col-xl-8 col-lg-12 mt-0">
//                     <HeaderDivider title="Latest news" />
//                     <div className="row g-3">
//                         <div className="col-xl-4 col-lg-6 col-md-6">
//                             <div className="row">
//                                 {latestsSidebar.map(article => (
//                                     <div className="col-xl-12 col-lg-6 col-md-6 col-sd-6 col-6" key={article.id || article.slug}>
//                                         <DynamicArticleCard
//                                             article={article}
//                                             showImage
//                                             priority={false}
//                                             imgHeight={143}
//                                             bgColor="#1176BB08"
//                                             bordered
//                                             showCategorie={!isMobile}
//                                         />
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                         <div className="col-xl-8 col-lg-6 col-md-6">
//                             <div className="">
//                                 {mainLatest && (
//                                     <DynamicArticleCard
//                                         key={mainLatest.id || mainLatest.slug}
//                                         article={mainLatest}
//                                         showImage
//                                         showHeader
//                                         priority={true}
//                                         imgHeight={321}
//                                         bordered
//                                         showExpt
//                                         titleStyle={'size20'}
//                                     />
//                                 )}
//                             </div>
//                             <div className="py-2">
//                                 <HeaderDivider title="Featured News" />
//                                 <div>
//                                     <TimeLine articles={featured || []} />
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     <Row className='pt-4'>
//                         <Col>
//                             <AdManager
//                                 position="bellow-featured-news"
//                                 priority={true}
//                                 className="mb-2"
//                             /></Col>
//                     </Row>
//                     <NewsSection title="Great Lakes Region" articles={africaArticles} />

//                     <Suspense fallback={<NewsSkeleton count={3} />}>
//                         <Videos />
//                     </Suspense>
//                     <Row>
//                         <Col>
//                             <AdManager
//                                 position="premium_leaderboard_1"
//                                 priority={true}
//                                 className="mb-2"
//                             /></Col>
//                     </Row>
//                     <NewsSection title="Entertainment" articles={entertainment} />
//                     <div className='mt-3 p-2' style={{ backgroundColor: '#f5f5f5' }}>
//                         <ThemedText className='d-flex justify-content-center' type='small'>Advertisement</ThemedText>
//                         <AdManager
//                             position="home-after-highlights"
//                             priority={true}
//                             className="mb-2"
//                         />
//                     </div>
//                     <NewsSection title="International" articles={internationalArticles} />
//                 </div>

//                 <div className="col-xl-4 col-lg-4 mt-0">
//                     <Suspense fallback={<NewsSkeleton count={1}/>}>
//                         <PopularNews articles={popular || []} name='Popular News' />
//                     </Suspense>
//                     <div className='pt-2'>
//                         <SectionWithToggle
//                             title='Advertorials'
//                             articles={advertorial}
//                             showImgs
//                             showDate
//                             titleBG='#1176BB'
//                         />
//                     </div>
//                     <div className='pt-3'>
//                         <SectionWithToggle title='Announcements' articles={announcement} titleBG='#282F2F' />
//                     </div>
//                     <div className='mt-3 p-2' style={{ backgroundColor: '#f5f5f5' }}>
//                         <ThemedText className='d-flex justify-content-center' type='small'>Advertisement</ThemedText>
//                         <AdManager
//                             position="after-announcements"
//                             priority={true}
//                             className="mb-2"
//                         />
//                     </div>
//                     <div className='pt-3'>
//                         <Suspense fallback={<NewsSkeleton count={1} />}>
//                             <Opinios />
//                         </Suspense>
//                     </div>
//                     <AdManager
//                         position="after-opinions"
//                         priority={true}
//                         className="mb-2"
//                     />
//                     <div className='py-4'>
//                         <Suspense fallback={null}>
//                             <RandomCard />
//                         </Suspense>
//                     </div>
//                     <AdManager
//                         position="after-facts"
//                         priority={true}
//                         className="mb-2"
//                     />

//                 </div>
//             </div>
//         </div>
//     )
// }




import React, { Suspense } from 'react'
import HeaderDivider from '../HeaderDivider'
import { NewsItem } from '@/types/fetchData'
import DynamicArticleCard from '../news/DynamicArticleCard'
import TimeLine from '../ReUsable/TimeLine'
import NewsSkeleton from '../NewsSkeleton'
import SectionWithToggle from '../ReUsable/SectionWithToggle'
import { ThemedText } from '../ThemedText'
import { Col, Row } from 'react-bootstrap'
import PopularNews from '../news/PopularNews'

import {
  getLatestArticles,
  getPopularArticles,
  getHighlightArticles,
  getAfricaArticles,
  getEntertainmentArticles,
  getFeaturedAdvertorial,
  getFeaturedAnnouncement,
  getInternationalArticles
} from './actions'
import AdManager from '../ads/AdManager'
import ServerSlotManager from '../ads/ServerSlotManager'

const Videos = React.lazy(() => import('./Videos'))
const Opinios = React.lazy(() => import('./Opinion'))
const RandomCard = React.lazy(() => import('./RandomCard'))

interface NewsSectionProps {
  title: string
  articles?: NewsItem[]
  isMobile: boolean
}

async function NewsSection({ title, articles, isMobile }: NewsSectionProps) {
  const safeArticles = Array.isArray(articles) ? articles : []
  const mainArticle = safeArticles?.[0]
  const subArticles = safeArticles?.slice(1, 3) || []
  const listArticles = safeArticles?.slice(3, 12) || []

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

export default async function Recents() {
  // Fetch all data on the server
  const [
    latests,
    popular,
    featured,
    africaArticles,
    internationalArticles,
    entertainment,
    advertorial,
    announcement
  ] = await Promise.all([
    getLatestArticles(),
    getPopularArticles(),
    getHighlightArticles(),
    getAfricaArticles(),
    getInternationalArticles(),
    getEntertainmentArticles(),
    getFeaturedAdvertorial(),
    getFeaturedAnnouncement()
  ])

  // Get device info from headers (you'll need to implement this)
  // For now, we'll pass it as a prop or use a client wrapper
  const isMobile = false // This should be determined from user agent

  const safeLatests = Array.isArray(latests) ? latests : []
  const mainLatest = safeLatests?.[0]
  const latestsSidebar = safeLatests?.slice(1, 6) || []



        


  return (
    <div className="container p-2">
      <div className="row g-4">
        <div className="col-xl-8 col-lg-12 mt-0">
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
                      showCategorie={!isMobile}
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
                  <TimeLine articles={featured || []} />
                </div>
              </div>
            </div>
          </div>

          <Row className='pt-4'>
            <Col>
              <ServerSlotManager
                position="bellow-featured-news"
                priority={true}
                className="mb-2"
              />
            </Col>
          </Row>
          
          <NewsSection title="Great Lakes Region" articles={africaArticles} isMobile={isMobile} />

          <Suspense fallback={<NewsSkeleton count={3} />}>
            <Videos />
          </Suspense>
          
          <Row>
            <Col>
              <ServerSlotManager
                position="premium_leaderboard_1"
                priority={true}
                className="mb-2"
              />
            </Col>
          </Row>
          
          <NewsSection title="Entertainment" articles={entertainment} isMobile={isMobile} />
          
          <div className='mt-3 p-2' style={{ backgroundColor: '#f5f5f5' }}>
            <ThemedText className='d-flex justify-content-center' type='small'>Advertisement</ThemedText>
            <ServerSlotManager
              position="home-after-highlights"
              priority={true}
              className="mb-2"
            />
          </div>
          
          <NewsSection title="International" articles={internationalArticles} isMobile={isMobile} />
        </div>

        <div className="col-xl-4 col-lg-4 mt-0">
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