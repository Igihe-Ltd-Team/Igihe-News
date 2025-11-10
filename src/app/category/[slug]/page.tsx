"use client"

import { useEffect,use } from 'react'
import { notFound } from 'next/navigation'
import { ApiService } from '@/services/apiService'
import DynamicArticleCard from '@/components/news/DynamicArticleCard'
import CategoryMainSection from '@/components/news/CategoryMainSection'
import { Col, Row } from 'react-bootstrap'
import PopularNews from '@/components/news/PopularNews'
import { Category } from '@/types/fetchData'
import HeaderDivider from '@/components/HeaderDivider'
import AdManager from '@/components/ads/AdManager'
import { useNewsData } from '@/hooks/useNewsData'
import { useInView } from 'react-intersection-observer'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { useCategoryArticles } = useNewsData()
  const { inView } = useInView()
  const { slug } = use(params)

  console.log(slug)

  
      const {
          data,
          fetchNextPage,
          hasNextPage,
          isFetchingNextPage,
          status,
      } = useCategoryArticles(Number(slug))
  
      useEffect(() => {
              if (inView && hasNextPage && !isFetchingNextPage) {
                  fetchNextPage()
              }
          }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])
          const allArticles = data?.pages.flatMap(page => page.data) || []





  if (!slug) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CategoryMainSection articles={allArticles} />
      <div className='pt-2 pb-4'>
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
            /></Col>
        </Row>
      </div>

      <div>
        <Row>
          <Col md={8}>
            <HeaderDivider title={'Latest Politics News'} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allArticles.map((article) => (
                <DynamicArticleCard
                  key={article.id}
                  article={article}
                  showImage
                  showExpt
                  imgHeight={160}
                  className='d-flex flex-row gap-3'
                />
              ))}
            </div>
          </Col>
          <Col md={4}>
            <PopularNews articles={allArticles} name={`Popular In ${slug}`} />
          </Col>
        </Row>
      </div>
    </div>
  )
}