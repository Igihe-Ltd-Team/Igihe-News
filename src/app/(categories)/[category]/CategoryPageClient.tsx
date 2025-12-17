"use client";

import { useEffect, useState } from "react";
import { Col, Row, Button } from "react-bootstrap";
import { Category } from "@/types/fetchData";
import DynamicArticleCard from "@/components/news/DynamicArticleCard";
import CategoryMainSection from "@/components/news/CategoryMainSection";
import PopularNews from "@/components/news/PopularNews";
import HeaderDivider from "@/components/HeaderDivider";
import AdManager from "@/components/ads/AdManager";
import CustomSlider from "@/components/home/CustomSlider";
import { useNewsData } from "@/hooks/useNewsData";

interface CategoryPageClientProps {
  initialPosts: any[];
  highlightArticles: any[];
  categoryInfo?: Category;
  initialPageInfo: {
    currentPage: number;
    lastPage: number;
    total: number;
  };
  slug: string;
}

export default function CategoryPageClient({
  initialPosts,
  highlightArticles,
  categoryInfo,
  initialPageInfo,
  slug
}: CategoryPageClientProps) {
  const { useCategorySlugArticles, useCategoryTagArticles } = useNewsData();
  const [posts, setPosts] = useState(initialPosts);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);

  // Infinite query for pagination

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useCategorySlugArticles(slug);


  // Update posts when data changes
  useEffect(() => {
    if (data?.pages) {
      const allPosts = data.pages.flatMap(page => page.posts?.data || []);
      setPosts(allPosts);
      
      const lastPage = data.pages[data.pages.length - 1];
      if (lastPage?.posts) {
        setPageInfo({
          currentPage: lastPage.posts.current_page,
          lastPage: lastPage.posts.last_page,
          total: lastPage.posts.total
        });
      }
    }
  }, [data]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Error state
  if (isError) {
    console.error("Error loading more articles:", error);
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Highlight Section */}
      <CategoryMainSection articles={highlightArticles} />

      {/* Ads Section */}
      <div className="pt-2 pb-4">
        <CustomSlider
          lgDisplay={2}
          mdDisplay={2}
          smDisplay={1}
        >
          <AdManager
            position="header-landscape-ad-1"
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

      {/* Main Content */}
      <div className="pb-md-4">
        <Row>
          {/* Articles Column */}
          <Col md={8}>
            <HeaderDivider title={`Latest ${categoryInfo?.name || "Category"} News`} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {posts.map((article) => (
                <DynamicArticleCard
                  key={article.id}
                  article={article}
                  showImage
                  showExpt
                  imgHeight={160}
                  className="d-flex flex-row gap-3"
                />
              ))}
              
              {/* Loading more skeletons */}
              {isFetchingNextPage && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={`skeleton-${i}`} className="animate-pulse">
                      <div className="bg-gray-200 h-48 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded mt-2"></div>
                      <div className="h-4 bg-gray-200 rounded mt-1 w-3/4"></div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
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

          {/* Sidebar */}
          <Col md={4} className="sticky-sidebar">
            <PopularNews
              articles={posts}
              name={`Popular In ${categoryInfo?.name || "Category"}`}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}
