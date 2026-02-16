"use client";

import { useEffect, useState, useTransition } from "react";
import { Col, Row, Button } from "react-bootstrap";
import { Category, NewsItem } from "@/types/fetchData";
import DynamicArticleCard from "@/components/news/DynamicArticleCard";
import SideBar from "@/components/ReUsable/SideBar";
import { fetchArticlesAnnounc } from "./actions";
import { ThemedText } from "@/components/ThemedText";
import { formatDate, getCategoryName, stripHtml } from "@/lib/utils";


interface AnnouncePageClientProps {
  initialPosts: NewsItem[];
  initialPageInfo: PageInfo;
}

interface PageInfo {
  currentPage: number;
  lastPage: number;
  total: number | undefined;
}


export default function AnnouncePageClient({
  initialPosts,
  initialPageInfo
}: AnnouncePageClientProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [isPending, startTransition] = useTransition();

  const loadMore = () => {
    if (pageInfo.currentPage >= pageInfo.lastPage) return;

    const nextPage = pageInfo.currentPage + 1;

    startTransition(async () => {
      const result = await fetchArticlesAnnounc(nextPage);

      if (result?.data) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-4">
              {posts.map((article,index) => (
                <a 
                                        // href={chechedfile.isImage? `/advertorial/article/${item.slug}` : chechedfile.filePath} 
                                        href={article?.file?.url ? article?.file?.url : `/advertorial/article/${article.slug}`} 
                                        target={article?.file?.url ? '_blank' : '_parent'}
                                        key={article.id}
                                        className={`list-group-item px-0 list-group-item-action}`}
                                        style={{ cursor: 'pointer', backgroundColor: 'transparent' }}
                                    >
                                        <div className="row">
                                          <div className="col-1">
                                              <i className="bi bi-file-earmark-pdf"></i>
                                          </div>
                                            <div className={"col-11"}>
                                                    <div className="mb-2">
                                                        <small style={{ color: '#999' }}>
                                                            <ThemedText className="me-3" type='small'>
                                                                {
                                                                    formatDate(article.date)
                                                                }
                                                            </ThemedText>
                                                            <ThemedText type='small'>
                                                                {getCategoryName(article)}
                                                            </ThemedText>
                                                        </small>
                                                    </div>
                                                <ThemedText type='small' darkColor='#fff' lightColor='#282F2F'>
                                                    {stripHtml(article.title.rendered)}
                                                </ThemedText>
                                            </div>
                                        </div>
                                    </a>
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