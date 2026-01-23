"use client";

import DynamicArticleCard from "@/components/news/DynamicArticleCard";
import { Col, Row, Button } from "react-bootstrap";
import PopularNews from "@/components/news/PopularNews";
import HeaderDivider from "@/components/HeaderDivider";
import AdManager from "@/components/ads/AdManager";
import { useNewsData } from "@/hooks/useNewsData";
import { Suspense, useEffect, useState } from "react";
import NewsSkeleton from "@/components/NewsSkeleton";
import CustomSlider from "@/components/home/CustomSlider";
import SocialMedias from "@/components/ReUsable/SocialMedias";
import SideBar from "@/components/ReUsable/SideBar";


export default function CategoryPage() {

  const { useOpinionArticles } = useNewsData();

  const [showLoadMore, setShowLoadMore] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useOpinionArticles();

  console.log('Opinions Data',data)

  const posts =  data?.pages.flatMap((page) => page.data) || [];

  // Effect to show load more button
  useEffect(() => {
    if (!isLoading && hasNextPage) {
      setShowLoadMore(true);
    }
  }, [isLoading, hasNextPage]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isError) {
    console.error("Error loading category:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2>Error loading content</h2>
          <p>Please try again later.</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!isLoading && !posts?.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2>No articles found</h2>
          <p>No articles available for this category.</p>
        </div>
      </div>
    );
  }

  // const categoryName = category.charAt(0).toUpperCase() + category.slice(1)

  return (
    <div className="container mx-auto px-4 py-8">
      
      <div className="pt-2 pb-4">

        <CustomSlider
                    lgDisplay={2}
                    mdDisplay={2}
                    smDisplay={1}
                >
                    <AdManager
                        position="premium_leaderboard_1"
                        priority={true}
                      className="mb-md-2"
                    />
                    <AdManager
                        position="header-landscape-ad-2"
                        priority={true}
                      className="mb-md-2"
                    />
                </CustomSlider>
                
      </div>

      <div className="pb-md-4">
        <Row>
          <Col md={8}>
            <HeaderDivider title={`Latest Opinions News`} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Suspense>
              {
                posts.map((article) => (
                  <DynamicArticleCard
                    key={article.id}
                    article={article}
                    showImage
                    showExpt
                    imgHeight={160}
                    className="d-flex flex-row gap-3"
                  />
                ))
              }
              </Suspense>
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
                    borderColor: "#1176BB",
                    color: "#1176BB",
                  }}
                >
                  {isFetchingNextPage ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Loading...
                    </>
                  ) : (
                    `Load More`
                  )}
                </Button>
              </div>
            )}

          </Col>

          <Col md={4} className="sticky-sidebar">
            {/* <PopularNews
              articles={posts}
              name={`Popular In`}
            /> */}
            <SideBar showSocials/>
          </Col>
        </Row>
      </div>
    </div>
  );
}