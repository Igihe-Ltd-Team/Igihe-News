'use client'

import AdManager from '@/components/ads/AdManager'
import Categories from '@/components/home/Categories'
import HomeMainSections from '@/components/home/HomeMainSections'
import Recents from '@/components/home/Recents'
import Slides from '@/components/home/Slides'
import NewsSkeleton from '@/components/NewsSkeleton'
import { useNewsData } from '@/hooks/useNewsData'
import { useUIStore } from '@/stores/uiStore'
import React, { Suspense, useMemo } from 'react'
import { Col, Container, Row } from 'react-bootstrap'


export function Home() {
  const {
    categories,
    categoriesLoading,
    featuredArticles,
    featuredArticlesLoading,
    videos,
    videosLoading,
    prefetchCategory,
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
  const { selectedCategory, setSelectedCategory } = useUIStore()


  const { sliderFeaturedArticles, otherFeaturedArticle } = useMemo(() => ({
    sliderFeaturedArticles: featuredArticles.slice(0, 8),
    otherFeaturedArticle: featuredArticles.slice(9, 20),
  }), [featuredArticles])

  if (categoriesLoading && featuredArticlesLoading) {
    return <NewsSkeleton />
  }
// console.log()
  return (
    <>
      <Container>
        <Slides articles={sliderFeaturedArticles} lgDisplay={3} mdDisplay={2} smDisplay={1} showControll />
      </Container>

      <Suspense fallback={<NewsSkeleton />}>
        <HomeMainSections
          articles={HighlightArticles} />
      </Suspense>
      <Suspense fallback={<NewsSkeleton />}>
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
      <Suspense fallback={<NewsSkeleton />}>
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
      <Categories categories={categories} />
      <Suspense fallback={<NewsSkeleton />}>
        <Categories categories={categories} />
      </Suspense>
    </>
  )
}
