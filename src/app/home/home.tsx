'use client'

import AdManager from '@/components/ads/AdManager'
import Categories from '@/components/home/Categories'
import HomeMainSections from '@/components/home/HomeMainSections'
import Recents from '@/components/home/Recents'
import Slides from '@/components/home/Slides'
import NewsSkeleton from '@/components/NewsSkeleton'
import { useNewsData } from '@/hooks/useNewsData'
import { useUIStore } from '@/stores/uiStore'
import React, { useMemo } from 'react'
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

    HighlightArticles,
    HighlightArticlesLoading,

    latestArticles,
    latestArticlesLoading,

    africaArticles,
    africaArticlesLoading,

    entertainmentArticles,
    entertainmentArticlesLoading

  } = useNewsData()
  const { selectedCategory, setSelectedCategory } = useUIStore()


  const { sliderFeaturedArticles, otherFeaturedArticle } = useMemo(() => ({
          sliderFeaturedArticles: featuredArticles.slice(0, 8),
          otherFeaturedArticle: featuredArticles.slice(9, 20),
      }), [featuredArticles])


  // console.log('featuredArticles',featuredArticles)

  if (categoriesLoading && featuredArticlesLoading) {
    return <NewsSkeleton />
  }

  return (
    <>
      <Container>
        <Slides articles={sliderFeaturedArticles} lgDisplay={3} mdDisplay={2} smDisplay={1} showControll />
      </Container>
      <HomeMainSections 
        articles={HighlightArticles} />
      <Recents
        latests={latestArticles}
        popular={popularArticles}
        featured={otherFeaturedArticle}
        advertorials={featuredArticles}
        africaArticles={africaArticles}
        entertainment={entertainmentArticles}
      />
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
      <Categories categories={categories} />
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

      <Categories categories={categories} />
    </>
  )
}
