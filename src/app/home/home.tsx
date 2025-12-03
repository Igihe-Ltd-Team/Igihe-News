'use client'

import AdManager from '@/components/ads/AdManager'
import Categories from '@/components/home/Categories'
import HomeMainSections from '@/components/home/HomeMainSections'
import Recents from '@/components/home/Recents'
import Slides from '@/components/home/Slides'
import NewsSkeleton from '@/components/NewsSkeleton'
import { useNewsData } from '@/hooks/useNewsData'
import { useUIStore } from '@/stores/uiStore'
import { prefetchCategoryArticles } from '@/utils/prefetch'
import React, { Suspense, useEffect, useMemo } from 'react'
import { Col, Container, Row } from 'react-bootstrap'


const upperCats = [
  {
    id: 7,
    name: 'Business',
    slug: 'business'
  },
  {
    id: 8,
    name: 'Technology',
    slug: 'science-technology'
  },
  {
    id: 9,
    name: 'Health',
    slug: 'health'
  },
  {
    id: 14,
    name: 'Tourism',
    slug: 'tourism'
  }]

const lowerCats = [
  {
    id: 10,
    name: 'Sports',
    slug: 'sports'
  },
  {
    id: 11,
    name: 'Arts & Culture',
    slug: 'arts-culture'
  },
  {
    id: 45,
    name: 'Education',
    slug: 'education'
  },
  {
    id: 18,
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
      <Suspense fallback={<NewsSkeleton count={3} />}>
        <Recents
          latests={latestArticles}
          popular={popularArticles}
          featured={otherFeaturedArticle}
          advertorials={featuredArticles}
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
        <Categories categories={categories} />
      </Suspense>
      <Suspense fallback={null}>
        <Container>
          <Row>
            <Col>
              <AdManager
                position="header-landscape-ad-1"
                priority={false}
                className="mb-2"
              />
            </Col>
            <Col>
              <AdManager
                position="header-landscape-ad-2"
                priority={false}
                className="mb-2"
              /></Col>
          </Row>
        </Container>
      </Suspense>
      <Suspense fallback={<NewsSkeleton count={1} />}>
        <Categories categories={categories} />
      </Suspense>
    </>
  )
}
