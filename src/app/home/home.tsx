'use client'

import AdManager from '@/components/ads/AdManager'
import Categories from '@/components/home/Categories'
import HomeMainSections from '@/components/home/HomeMainSections'
import Recents from '@/components/home/Recents'
import Slides from '@/components/home/Slides'
import NewsSkeleton from '@/components/NewsSkeleton'
import TimeLine from '@/components/ReUsable/TimeLine'
import { useNewsData } from '@/hooks/useNewsData'
import React, { Suspense, useEffect, useMemo } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { useFeaturedArticles,useTopSliderArticles } from '@/hooks/useMainNewsData'


const upperCats = [
  {
    id: 87,
    name: 'Business',
    slug: 'business'
  },
  {
    id: 157,
    name: 'Science',
    slug: 'science-news'
  },
  {
    id: 116,
    name: 'Health',
    slug: 'health'
  },
  {
    id: 115,
    name: 'Tourism',
    slug: 'tourism'
  }]

const lowerCats = [
  {
    id: 103,
    name: 'Sports',
    slug: 'sports'
  },
  {
    id: 126,
    name: 'Arts & Culture',
    slug: 'arts-culture'
  },
  {
    id: 124,
    name: 'Environment',
    slug: 'environment'
  },
  {
    id: 155,
    name: 'Diaspora',
    slug: 'diaspora'
  }]
  

export function Home() {
  const { data: articles = [], isLoading:articlesLoading, error } = useFeaturedArticles()
  const { data: topSlider = [],isLoading:topSliderLoading } = useTopSliderArticles()
  const {
    liveEvent,
    liveEventLoading,
    mainArticle,
    mainArticleLoading,
    featuredArticles,
    featuredArticlesLoading,
    // prefetchCategory,
    popularArticles,
    popularArticlesLoading,

    highlightArticles:featuredNews,
    highlightArticlesLoading,

    latestArticles,
    latestArticlesLoading,

    africaArticles,
    africaArticlesLoading,

    entertainmentArticles,
    entertainmentArticlesLoading,

    featuredAdvertorial,
    featuredAdvertorialLoading,

    featuredAnnouncement,
    featuredAnnouncementLoading

  } = useNewsData()

  const safeFeaturedArticles = Array.isArray(featuredArticles) ? featuredArticles : [];
  // console.log(safeFeaturedArticles)
  // const { sliderFeaturedArticles, otherFeaturedArticle } = useMemo(() => ({
  //   sliderFeaturedArticles: safeFeaturedArticles.slice(0, 8),
  //   otherFeaturedArticle: safeFeaturedArticles.slice(9, 30),
  // }), [safeFeaturedArticles]);


  
  return (
    <>
      <Container>
        <Suspense fallback={<NewsSkeleton count={3} />}>
        {
          liveEvent?.length > 0 ? 
          // <Slides articles={topSlider} lgDisplay={3} mdDisplay={2} smDisplay={1} showControll />
          <TimeLine articles={liveEvent}/>
          :
          topSlider?.length > 0 &&
           <Slides articles={topSlider} lgDisplay={3} mdDisplay={2} smDisplay={1} showControll />
        }
        
        </Suspense>
      </Container>

      <Suspense fallback={<NewsSkeleton count={3} />}>
        <HomeMainSections/>
      </Suspense>


       <Suspense fallback={null}>
        <Container>
          <Row>
            <Col>
              <AdManager
                position="home-bellow-hights"
                priority={true}
              /></Col>
            <Col>
              <AdManager
                position="home-bellow-hights-2"
                priority={true}
              />
            </Col>
          </Row>
        </Container>
      </Suspense>

      <Suspense fallback={<NewsSkeleton count={3} />}>
        <Recents/>
      </Suspense>
      <Suspense fallback={null}>
        <Container>
          <Row>
            <Col>
              <AdManager
                position="header-landscape-ad-1"
                priority={true}
                className="mb-2"
              /></Col>
            <Col>
              <AdManager
                position="header-landscape-ad-2"
                priority={true}
                className="mb-2"
              />
            </Col>
          </Row>
        </Container>
      </Suspense>
      <Suspense fallback={<NewsSkeleton count={1} />}>
        <Categories categories={upperCats} />
      </Suspense>
      <Suspense fallback={null}>
        <Container>
          <Row>
            <Col>
              <AdManager
                position="header-landscape-ad-1"
                priority={true}
                className="mb-2"
              />
            </Col>
            <Col>
              <AdManager
                position="header-landscape-ad-2"
                priority={true}
                className="mb-2"
              /></Col>
          </Row>
        </Container>
      </Suspense>
      <Suspense fallback={<NewsSkeleton count={1} />}>
        <Categories categories={lowerCats} />
      </Suspense>
    </>
  )
}
