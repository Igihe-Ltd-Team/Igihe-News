'use client'


import AdManager from '@/components/ads/AdManager'
import Categories from '@/components/home/Categories'
import HomeMainSections from '@/components/home/HomeMainSections'
import Recents from '@/components/home/Recents'
import NewsSkeleton from '@/components/NewsSkeleton'
import { useNewsData } from '@/hooks/useNewsData'
import { useUIStore } from '@/stores/uiStore'
import React from 'react'
import { Col, Container, Row } from 'react-bootstrap'


export function Home() {
  const {
    categories,
    categoriesLoading,
    featuredArticles,
    featuredArticlesLoading,
    videos,
    videosLoading,
    prefetchCategory
  } = useNewsData()
  const { selectedCategory, setSelectedCategory } = useUIStore()


  if (categoriesLoading && featuredArticlesLoading) {
    return <NewsSkeleton />
  }

  return (
    <>
      <HomeMainSections articles={featuredArticles} />
      <Recents latests={featuredArticles}
        popular={featuredArticles}
        featured={featuredArticles}
        advertorials={featuredArticles}
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
