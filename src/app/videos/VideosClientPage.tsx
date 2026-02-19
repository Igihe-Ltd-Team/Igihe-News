"use client";

import { useEffect, useState, useTransition } from "react";
import { Col, Row, Button, Container } from "react-bootstrap";
import { Category, NewsItem } from "@/types/fetchData";
import DynamicArticleCard from "@/components/news/DynamicArticleCard";
import SideBar from "@/components/ReUsable/SideBar";
import { fetchArticlesAdvertorials } from "./actions";
import VideoCard from "@/components/videos/VideoCard";
import { getFeaturedImage, getYouTubeVideoId, stripHtml } from "@/lib/utils";
import HeaderDivider from "@/components/HeaderDivider";


interface VideosClientPageProps {
  initialPosts: NewsItem[];
  initialPageInfo: PageInfo;
}

interface PageInfo {
  currentPage: number;
  lastPage: number;
  total: number | undefined;
}


export default function VideosClientPage({
  initialPosts,
  initialPageInfo
}: VideosClientPageProps) {
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
    <Container className='igihe-videos py-4'>
      <HeaderDivider title="Latest Videos" />
            <div className="video-container d-grid pt-4">
              {posts.map((article) => (
                <VideoCard
                    key={article.id}
                    thumbNail={getFeaturedImage(article) || '/default-thumb.jpg'}
                    title={stripHtml(article?.title?.rendered )|| 'Untitled Video'}
                    slug={article?.slug || 'youtube-video'}
                    videoId={getYouTubeVideoId(article?.video_url || '')}
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
            </Container>
  );
}