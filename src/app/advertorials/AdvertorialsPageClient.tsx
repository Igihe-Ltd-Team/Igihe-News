"use client";

import { useEffect, useState, useTransition } from "react";
import { Col, Row, Button } from "react-bootstrap";
import { Category, NewsItem } from "@/types/fetchData";
import DynamicArticleCard from "@/components/news/DynamicArticleCard";
import SideBar from "@/components/ReUsable/SideBar";
import { fetchArticlesAdvertorials } from "./actions";


interface AdvertorialsPageClientProps {
  initialPosts: NewsItem[];
  initialPageInfo: PageInfo;
}

interface PageInfo {
  currentPage: number;
  lastPage: number;
  total: number | undefined;
}


export default function AdvertorialsPageClient({
  initialPosts,
  initialPageInfo
}: AdvertorialsPageClientProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [isPending, startTransition] = useTransition();

  const loadMore = () => {
    if (pageInfo.currentPage >= pageInfo.lastPage) return;

    const nextPage = pageInfo.currentPage + 1;

    startTransition(async () => {
      const result = await fetchArticlesAdvertorials(nextPage);

      if (result?.data) {
        // Append new posts to existing posts
        setPosts(prevPosts => [...prevPosts, ...result.data]);
        setPageInfo({
          currentPage: result.pagination.currentPage,
          lastPage: result.pagination.totalPages,
          total: result.pagination.totalPosts
        });
      }
    });
  };
  const hasMore = pageInfo.currentPage < pageInfo.lastPage;


  return (
    <div className="container mx-auto px-4 py-8">
      {/* Highlight Section */}

      <div className="pb-md-4">
        <Row>
          <Col md={8}>
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
              {isPending && (
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
            {hasMore && (
              <div className="text-center mb-8">
                <Button
                  variant="outline-light"
                  onClick={loadMore}
                  disabled={isPending}
                  size="lg"
                  className="px-8 py-2"
                  style={{
                    borderColor: "#1176BB",
                    color: "#1176BB",
                  }}
                >
                  {isPending ? (
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
            <SideBar
              showSocials
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}