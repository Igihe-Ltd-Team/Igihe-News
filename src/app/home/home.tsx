'use client'

import AdManager from '@/components/ads/AdManager'
import Categories from '@/components/home/Categories'
import HomeMainSections from '@/components/home/HomeMainSections'
import Recents from '@/components/home/Recents'
import Slides from '@/components/home/Slides'
import NewsSkeleton from '@/components/NewsSkeleton'
import { useNewsData } from '@/hooks/useNewsData'
import React, { Suspense, useEffect, useMemo } from 'react'
import { Col, Container, Row } from 'react-bootstrap'


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
  const {
    categories,
    categoriesLoading,
    featuredArticles,
    featuredArticlesLoading,
    // prefetchCategory,
    popularArticles,
    popularArticlesLoading,

    highlightArticles,
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
  // const { selectedCategory, setSelectedCategory } = useUIStore()

  const safeFeaturedArticles = Array.isArray(featuredArticles) ? featuredArticles : [];
  const { sliderFeaturedArticles, otherFeaturedArticle } = useMemo(() => ({
    sliderFeaturedArticles: safeFeaturedArticles.slice(0, 8),
    otherFeaturedArticle: safeFeaturedArticles.slice(8, 20),
  }), [safeFeaturedArticles]);

  // useEffect(() => {
  //   (async () => {
  //     console.log('prefetchCategory', await prefetchCategoryArticles(31))
  //   })
  // }, [])



  // if (categoriesLoading && featuredArticlesLoading) {
  //   return <NewsSkeleton />
  // }
  // console.log()
  return (
    <>
      <Container>
        <Suspense fallback={<NewsSkeleton count={3} />}>
          <Slides articles={sliderFeaturedArticles} lgDisplay={3} mdDisplay={2} smDisplay={1} showControll />
        </Suspense>
      </Container>

      <Suspense fallback={<NewsSkeleton count={3} />}>
        <HomeMainSections
          articles={highlightArticles} />
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
        <Recents
          latests={latestArticles}
          popular={popularArticles}
          featured={otherFeaturedArticle}
          africaArticles={africaArticles}
          entertainment={entertainmentArticles}
          advertorial={featuredAdvertorial}
          announcement={featuredAnnouncement}
        />
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
