"use client";

import { useEffect, useState, useTransition } from "react";
import { Col, Row, Button } from "react-bootstrap";
import { Category, NewsItem } from "@/types/fetchData";
import DynamicArticleCard from "@/components/news/DynamicArticleCard";
import CategoryMainSection from "@/components/news/CategoryMainSection";
import HeaderDivider from "@/components/HeaderDivider";
import AdManager from "@/components/ads/AdManager";
import CustomSlider from "@/components/home/CustomSlider";
import { useNewsData } from "@/hooks/useNewsData";
import SideBar from "@/components/ReUsable/SideBar";
import { fetchArticlesByCategory } from "./action";

interface CategoryPageClientProps {
  initialPosts: NewsItem[];
  highlightArticles: NewsItem[];
  categoryInfo: Category; // Make required, not optional
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
  const [posts, setPosts] = useState(initialPosts);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
    const [isPending, startTransition] = useTransition();

  const [displayHighlights] = useState(highlightArticles);
  const loadMore = () => {
      if (pageInfo.currentPage >= pageInfo.lastPage) return;
  
      const nextPage = pageInfo.currentPage + 1;
  
      startTransition(async () => {
        const result = await fetchArticlesByCategory(categoryInfo.id, nextPage);
  
        if (result?.data) {
          // Append new posts to existing posts
          setPosts(prevPosts => [...prevPosts, ...result.data]);
          setPageInfo({
            currentPage: result.pagination.currentPage,
            lastPage: result.pagination.totalPages,
            total: result.pagination.totalPosts || 0
          });
        }
      });
    };

  const canLoadMore = pageInfo.currentPage < pageInfo.lastPage;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Highlight Section */}
      <CategoryMainSection articles={displayHighlights} />

      {/* Ads Section */}
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

      {/* Main Content */}
      <div className="pb-md-4">
        <Row>
          {/* Articles Column */}
          <Col md={8}>
            <HeaderDivider title={`Latest ${categoryInfo.name} News`} />

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
            {canLoadMore && (
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
              posts={posts}
              categoryInfo={categoryInfo}
              slug={slug}
              showSocials
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}









// "use client";

// import { useEffect, useState } from "react";
// import { Col, Row, Button } from "react-bootstrap";
// import { Category, NewsItem } from "@/types/fetchData";
// import DynamicArticleCard from "@/components/news/DynamicArticleCard";
// import CategoryMainSection from "@/components/news/CategoryMainSection";
// import HeaderDivider from "@/components/HeaderDivider";
// import AdManager from "@/components/ads/AdManager";
// import CustomSlider from "@/components/home/CustomSlider";
// import { useNewsData } from "@/hooks/useNewsData";
// import SideBar from "@/components/ReUsable/SideBar";

// interface CategoryPageClientProps {
//   initialPosts: NewsItem[];
//   highlightArticles: NewsItem[];
//   categoryInfo: Category; // Make required, not optional
//   initialPageInfo: {
//     currentPage: number;
//     lastPage: number;
//     total: number;
//   };
//   slug: string;
// }

// export default function CategoryPageClient({
//   initialPosts,
//   highlightArticles,
//   categoryInfo,
//   initialPageInfo,
//   slug
// }: CategoryPageClientProps) {
//   const { useCategorySlugArticles } = useNewsData();
//   const [posts, setPosts] = useState(initialPosts);
//   const [pageInfo, setPageInfo] = useState(initialPageInfo);

//   // Use server-provided highlights - no client refetch needed
//   const [displayHighlights] = useState(highlightArticles);

//   // Infinite query for pagination - starts from page 2
//   const {
//     data,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//     isError,
//     error,
//   } = useCategorySlugArticles(slug);

//   // Update posts when data changes (for page 2+)
//   useEffect(() => {
//     if (data?.pages && data.pages.length > 0) {
//       // Combine initial posts with newly fetched pages
//       const newPosts = data.pages.flatMap(page => page.posts?.data || []);
//       setPosts([...initialPosts, ...newPosts]);
      
//       const lastPage = data.pages[data.pages.length - 1];
//       if (lastPage?.posts) {
//         setPageInfo({
//           currentPage: lastPage.posts.pagination.currentPage,
//           lastPage: lastPage.posts.pagination.totalPages,
//           total: lastPage.posts.pagination.totalPages
//         });
//       }
//     }
//   }, [data, initialPosts]);

//   const handleLoadMore = () => {
//     if (hasNextPage && !isFetchingNextPage) {
//       fetchNextPage();
//     }
//   };

//   // Error state
//   if (isError) {
//     console.error("Error loading more articles:", error);
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="text-center">
//           <h2>Error loading content</h2>
//           <p>Please try again later.</p>
//           <Button variant="primary" onClick={() => window.location.reload()}>
//             Retry
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   // Show if there are more pages beyond the initial load
//   const canLoadMore = pageInfo.currentPage < pageInfo.lastPage;

//   return (
//     <div className="container mx-auto px-4 py-8">
//       {/* Highlight Section */}
//       <CategoryMainSection articles={displayHighlights} />

//       {/* Ads Section */}
//       <div className="pt-2 pb-4">
//         <CustomSlider
//           lgDisplay={2}
//           mdDisplay={2}
//           smDisplay={1}
//         >
//           <AdManager
//             position="premium_leaderboard_1"
//             priority={true}
//             className="mb-md-2"
//           />
//           <AdManager
//             position="header-landscape-ad-2"
//             priority={true}
//             className="mb-md-2"
//           />
//         </CustomSlider>
//       </div>

//       {/* Main Content */}
//       <div className="pb-md-4">
//         <Row>
//           {/* Articles Column */}
//           <Col md={8}>
//             <HeaderDivider title={`Latest ${categoryInfo.name} News`} />

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//               {posts.map((article) => (
//                 <DynamicArticleCard
//                   key={article.id}
//                   article={article}
//                   showImage
//                   showExpt
//                   imgHeight={160}
//                   className="d-flex flex-row gap-3"
//                 />
//               ))}
              
//               {/* Loading more skeletons */}
//               {isFetchingNextPage && (
//                 <>
//                   {[...Array(3)].map((_, i) => (
//                     <div key={`skeleton-${i}`} className="animate-pulse">
//                       <div className="bg-gray-200 h-48 rounded"></div>
//                       <div className="h-4 bg-gray-200 rounded mt-2"></div>
//                       <div className="h-4 bg-gray-200 rounded mt-1 w-3/4"></div>
//                     </div>
//                   ))}
//                 </>
//               )}
//             </div>

//             {/* Load More Button */}
//             {canLoadMore && (
//               <div className="text-center mb-8">
//                 <Button
//                   variant="outline-light"
//                   onClick={handleLoadMore}
//                   disabled={isFetchingNextPage}
//                   size="lg"
//                   className="px-8 py-2"
//                   style={{
//                     borderColor: "#1176BB",
//                     color: "#1176BB",
//                   }}
//                 >
//                   {isFetchingNextPage ? (
//                     <>
//                       <span
//                         className="spinner-border spinner-border-sm me-2"
//                         role="status"
//                         aria-hidden="true"
//                       ></span>
//                       Loading...
//                     </>
//                   ) : (
//                     `Load More`
//                   )}
//                 </Button>
//               </div>
//             )}
//           </Col>

//           {/* Sidebar */}
//           <Col md={4} className="sticky-sidebar">
//             <SideBar
//               posts={posts}
//               categoryInfo={categoryInfo}
//               slug={slug}
//               showSocials
//             />
//           </Col>
//         </Row>
//       </div>
//     </div>
//   );
// }