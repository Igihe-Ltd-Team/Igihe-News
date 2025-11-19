"use client"

import { notFound } from 'next/navigation'
import DynamicArticleCard from '@/components/news/DynamicArticleCard'
import CategoryMainSection from '@/components/news/CategoryMainSection'
import { Col, Row, Button } from 'react-bootstrap'
import PopularNews from '@/components/news/PopularNews'
import HeaderDivider from '@/components/HeaderDivider'
import AdManager from '@/components/ads/AdManager'
import { useNewsData } from '@/hooks/useNewsData'
import { use, useEffect, useState } from 'react'
import NewsSkeleton from '@/components/NewsSkeleton'
import SingleSkeleton from '@/components/Loading/SingleSkeleton'

interface CategoryPageProps {
  params: Promise<{ category: string }>
}

export default function CategoryPage({ params }: CategoryPageProps) {
  // First, resolve the params using use() - this must be at the top level
  const { category } = use(params)
  
  // Then declare all hooks
  const [showLoadMore, setShowLoadMore] = useState(false)
  const { useCategorySlugArticles,useCategoryTagArticles } = useNewsData()
  
  // Now use the hook with the resolved slug
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useCategorySlugArticles(category)
  // console.log(data)

  const {
    data: highlightArticles = [],
    isLoading:highLightLoading
  } = useCategoryTagArticles(39,data?.pages?.[0]?.category?.id)

  // console.log('featured',data?.pages?.[0]?.category?.id)


  const posts = data?.pages.flatMap(page => page.posts.data) || []

  // Effect to show load more button
  useEffect(() => {
    if (!isLoading && hasNextPage) {
      setShowLoadMore(true)
    }
  }, [isLoading, hasNextPage])

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  // Loading state
  if (isLoading) {
    return <NewsSkeleton />
  }

  // Error state
  if (isError) {
    console.error('Error loading category:', error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2>Error loading content</h2>
          <p>Please try again later.</p>
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!posts.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2>No articles found</h2>
          <p>No articles available for this category.</p>
        </div>
      </div>
    )
  }

  const categoryName = category.charAt(0).toUpperCase() + category.slice(1)

  return (
    <div className="container mx-auto px-4 py-8">
      {
        highLightLoading ? <SingleSkeleton/>
        :
        <CategoryMainSection articles={highlightArticles} />
      }
      
      
      <div className='pt-2 pb-4'>
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
            />
          </Col>
        </Row>
      </div>

      <div>
        <Row>
          <Col md={8}>
            <HeaderDivider title={`Latest ${categoryName} News`} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {posts.map((article) => (
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

            {showLoadMore && hasNextPage && (
              <div className="text-center mb-8">
                <Button
                  variant="outline-light"
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                  size="lg"
                  className="px-8 py-2"
                  style={{
                    borderColor:'#1176BB',
                    color:'#1176BB'
                  }}
                >
                  {isFetchingNextPage ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Loading...
                    </>
                  ) : (
                    `Load More`
                  )}
                </Button>
              </div>
            )}

            {/* No more articles message */}
            {/* {!hasNextPage && posts.length > 0 && (
              <div className="text-center text-muted py-4">
                <p>You've reached the end of the articles.</p>
              </div>
            )} */}
          </Col>
          
          <Col md={4} className='sticky-sidebar'>
            <PopularNews articles={posts} name={`Popular In ${categoryName}`} />
          </Col>
        </Row>
      </div>
    </div>
  )
}