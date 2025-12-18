// import { Category } from "@/types/fetchData";
// import CategoryPageClient from "./CategoryPageClient";
// import { ApiService } from "@/services/apiService";
// import { prefetchAllHomeData } from "@/lib/prefetch-home-data";

// interface CategoryPageProps {
//   params: Promise<{ category: string }>;
//   searchParams?: { [key: string]: string | string[] | undefined };
// }

// export default async function CategoryPage({ params }: CategoryPageProps) {
//   const { category } = await params
//   const initialData = await prefetchAllHomeData()
//   const categories = initialData.categories


//   const thisCategory = categories?.find(
//       (single: Category) => single.slug === category
//     );
//     if (!thisCategory) {
//   throw new Error("Category not found");
// }
// // console.log('categoryId',thisCategory)
// const categoryId = thisCategory?.id
//   try {
//     // Fetch initial data server-side
//     const [ initialArticles, highlightArticles] = await Promise.all([
//       ApiService.fetchArticles({categories: [categoryId]}),
//       ApiService.fetchArticles({ 
//       tags: [63], 
//       ...(categoryId && { categories: [categoryId] }),
//       per_page: 7 
//     }).then(r => r.data)
//     ]);

//     // console.log('initialArticles',initialArticles)
//     // console.log('highlightArticles',highlightArticles)

//     // Transform data for client component
//     const posts = initialArticles?.data || [];
//     const pageInfo = {
//       currentPage: initialArticles?.pagination.currentPage || 1,
//       lastPage: initialArticles?.pagination.totalPages || 1,
//       total: initialArticles?.pagination.totalPosts || 0
//     };

//     return (
//       <CategoryPageClient
//         initialPosts={posts}
//         highlightArticles={highlightArticles || []}
//         categoryInfo={thisCategory}
//         initialPageInfo={pageInfo}
//         slug={category}
//       />
//     );
//   } catch (error) {
//     console.error("Server-side error:", error);
//     // You can return an error component or fallback here
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="text-center">
//           <h2>Error loading content</h2>
//           <p>Please try again later.</p>
//         </div>
//       </div>
//     );
//   }
// }






// "use client";

// import DynamicArticleCard from "@/components/news/DynamicArticleCard";
// import CategoryMainSection from "@/components/news/CategoryMainSection";
// import { Col, Row, Button } from "react-bootstrap";
// import PopularNews from "@/components/news/PopularNews";
// import HeaderDivider from "@/components/HeaderDivider";
// import AdManager from "@/components/ads/AdManager";
// import { useNewsData } from "@/hooks/useNewsData";
// import { use, useEffect, useState } from "react";
// import NewsSkeleton from "@/components/NewsSkeleton";
// import SingleSkeleton from "@/components/Loading/SingleSkeleton";
// import { Category } from "@/types/fetchData";
// import CustomSlider from "@/components/home/CustomSlider";

// interface CategoryPageProps {
//   params: Promise<{ category: string }>;
// }

// export default async function CategoryPage({ params }: CategoryPageProps) {
//   const { category } = use(params);
//   const { categories } = useNewsData();
//   const thisCategory = categories?.find(
//     (single: Category) => single.slug === category
//   );

//   const [showLoadMore, setShowLoadMore] = useState(false);
//   const { useCategorySlugArticles, useCategoryTagArticles } = useNewsData();

//   const {
//     data,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//     isLoading,
//     isError,
//     error,
//   } = useCategorySlugArticles(category);

//   const { data: highlightArticles = [], isLoading: highLightLoading } =
//     useCategoryTagArticles(63, thisCategory?.id);
//   // console.log('featured',data?.pages?.[0]?.category?.id)

//   const posts = data?.pages.flatMap((page) => page.posts.data) || [];

//   // Effect to show load more button
//   useEffect(() => {
//     if (!isLoading && hasNextPage) {
//       setShowLoadMore(true);
//     }
//   }, [isLoading, hasNextPage]);

//   const handleLoadMore = () => {
//     if (hasNextPage && !isFetchingNextPage) {
//       fetchNextPage();
//     }
//   };

//   if (isError) {
//     console.error("Error loading category:", error);
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

//   if (!isLoading && !posts.length) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="text-center">
//           <h2>No articles found</h2>
//           <p>No articles available for this category.</p>
//         </div>
//       </div>
//     );
//   }

//   // const categoryName = category.charAt(0).toUpperCase() + category.slice(1)

//   return (
//     <div className="container mx-auto px-4 py-8">
//       {highLightLoading ? (
//         <SingleSkeleton />
//       ) : (
//         <CategoryMainSection articles={highlightArticles} />
//       )}

//       <div className="pt-2 pb-4">

//         <CustomSlider
//                     lgDisplay={2}
//                     mdDisplay={2}
//                     smDisplay={1}
//                 >
//                     <AdManager
//                         position="header-landscape-ad-1"
//                         priority={true}
//                       className="mb-md-2"
//                     />
//                     <AdManager
//                         position="header-landscape-ad-2"
//                         priority={true}
//                       className="mb-md-2"
//                     />
//                 </CustomSlider>
                
//       </div>

//       <div className="pb-md-4">
//         <Row>
//           <Col md={8}>
//             <HeaderDivider title={`Latest ${thisCategory?.name} News`} />

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//               {isLoading ? (
//                 <NewsSkeleton />
//               ) : (
//                 posts.map((article) => (
//                   <DynamicArticleCard
//                     key={article.id}
//                     article={article}
//                     showImage
//                     showExpt
//                     imgHeight={160}
//                     className="d-flex flex-row gap-3"
//                   />
//                 ))
//               )}
//             </div>

//             {showLoadMore && hasNextPage && (
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

//           <Col md={4} className="sticky-sidebar">
//             <PopularNews
//               articles={posts}
//               name={`Popular In ${thisCategory?.name}`}
//             />
//           </Col>
//         </Row>
//       </div>
//     </div>
//   );
// }




import { Category } from "@/types/fetchData";
import CategoryPageClient from "./CategoryPageClient";
import { ApiService } from "@/services/apiService";
import { prefetchAllHomeData } from "@/lib/prefetch-home-data";
import { notFound } from "next/navigation";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  try {
    const { category } = await params;
    
    // Validate category slug exists
    if (!category) {
      notFound();
    }

    const initialData = await prefetchAllHomeData();
    const categories = initialData.categories;

    // Validate categories data exists
    if (!categories || !Array.isArray(categories)) {
      throw new Error("Categories data is unavailable");
    }

    const thisCategory = categories.find(
      (single: Category) => single.slug === category
    );
    
    if (!thisCategory) {
      notFound(); // Use Next.js notFound() instead of throwing
    }
    
    const categoryId = thisCategory.id;

    // Add validation for categoryId
    if (!categoryId) {
      throw new Error("Category ID is missing");
    }

    // Fetch initial data server-side
    const [initialArticles, highlightArticlesResponse] = await Promise.all([
      ApiService.fetchArticles({ categories: [categoryId] }),
      ApiService.fetchArticles({ 
        tags: [63], 
        categories: [categoryId],
        per_page: 7 
      })
    ]);

    // Add null checks
    const highlightArticles = highlightArticlesResponse?.data || [];
    const posts = initialArticles?.data || [];
    const pageInfo = {
      currentPage: initialArticles?.pagination?.currentPage || 1,
      lastPage: initialArticles?.pagination?.totalPages || 1,
      total: initialArticles?.pagination?.totalPosts || 0
    };

    return (
      <CategoryPageClient
        initialPosts={posts}
        highlightArticles={highlightArticles}
        categoryInfo={thisCategory}
        initialPageInfo={pageInfo}
        slug={category}
      />
    );
  } catch (error) {
    // Log the actual error for debugging
    console.error("Server-side error in CategoryPage:", error);
    
    // Check if it's a not-found error
    if (error instanceof Error && error.message === "NEXT_NOT_FOUND") {
      notFound();
    }
    
    // Return error UI for other errors
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error loading content</h2>
          <p className="text-gray-600">Please try again later.</p>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-4 text-left text-sm bg-gray-100 p-4 rounded">
              {error instanceof Error ? error.message : "Unknown error"}
            </pre>
          )}
        </div>
      </div>
    );
  }
}






// import { Category } from "@/types/fetchData";
// import CategoryPageClient from "./CategoryPageClient";
// import { notFound } from "next/navigation";

// interface CategoryPageProps {
//   params: Promise<{ category: string }>;
// }


// export async function generateStaticParams() {
//   const { prefetchAllHomeData } = await import("@/lib/prefetch-home-data");
//   const data = await prefetchAllHomeData().catch(() => ({ categories: [] }));
  
//   return data.categories.map((cat: Category) => ({
//     category: cat.slug,
//   }));
// }

// export default async function CategoryPage({ params }: CategoryPageProps) {
//   // During build, return a minimal version
  
//   try {
//     const { category: categorySlug } = await params;
    
//     if (!categorySlug) {
//       notFound();
//     }

//     // Dynamically import to avoid build-time issues
//     const { prefetchAllHomeData } = await import("@/lib/prefetch-home-data");
//     const { ApiService } = await import("@/services/apiService");

//     // First, get the categories to find the ID
//     const initialData = await prefetchAllHomeData().catch(() => ({ categories: [] }));
//     const categories = initialData.categories || [];
    
//     // Find the category by slug
//     const thisCategory = categories.find(
//       (single: Category) => single.slug === categorySlug
//     );
    
//     if (!thisCategory) {
//       notFound();
//     }

//     const categoryId = thisCategory.id;

//     // Now fetch articles using the category ID
//     const [initialArticles, highlightArticlesResponse] = await Promise.all([
//       ApiService.fetchArticles({ 
//         categories: [categoryId] // Fixed: Use categoryId, not categorySlug
//       }).catch(() => ({ 
//         data: [], 
//         pagination: { currentPage: 1, totalPages: 1, totalPosts: 0 }
//       })),
//       ApiService.fetchArticles({ 
//         tags: [63], 
//         categories: [categoryId], // Fixed: Use categoryId
//         per_page: 7 
//       }).catch(() => ({ data: [] }))
//     ]);

//     const posts = initialArticles.data || [];
//     const highlightArticles = highlightArticlesResponse.data || [];
//     const pageInfo = {
//       currentPage: initialArticles.pagination?.currentPage || 1,
//       lastPage: initialArticles.pagination?.totalPages || 1,
//       total: initialArticles.pagination?.totalPosts || 0
//     };

//     return (
//       <CategoryPageClient
//         initialPosts={posts}
//         highlightArticles={highlightArticles}
//         categoryInfo={thisCategory}
//         initialPageInfo={pageInfo}
//         slug={categorySlug}
//       />
//     );
//   } catch (error) {
//     console.error("CategoryPage error:", error);
    
//     // Don't throw during build - return a fallback
    
    
//     notFound();
//   }
// }








// import { Category } from "@/types/fetchData";
// import CategoryPageClient from "./CategoryPageClient";
// import { notFound } from "next/navigation";

// interface CategoryPageProps {
//   params: Promise<{ category: string }>;
// }

// export async function generateStaticParams() {
//   const { prefetchAllHomeData } = await import("@/lib/prefetch-home-data");
//   const data = await prefetchAllHomeData().catch(() => ({ categories: [] }));
  
//   return data.categories.map((cat: Category) => ({
//     category: cat.slug,
//   }));
// }

// export default async function CategoryPage({ params }: CategoryPageProps) {
//   const { category: categorySlug } = await params;

//   // 1. Get Category List (This should be cached/memoized by Next.js)
//   const { prefetchAllHomeData } = await import("@/lib/prefetch-home-data");
//   const { ApiService } = await import("@/services/apiService");
  
//   const initialData = await prefetchAllHomeData().catch(() => ({ categories: [] }));
//   const thisCategory = initialData.categories?.find(
//     (single: Category) => single.slug === categorySlug
//   );

//   if (!thisCategory) notFound();

//   // 2. Parallel Fetch (Crucial for speed)
//   // We fetch only the first page here. The Client component handles the rest.
//   const [initialArticles, highlightArticles] = await Promise.all([
//     ApiService.fetchArticles({ categories: [thisCategory.id] }).catch(() => null),
//     ApiService.fetchArticles({ tags: [63], categories: [thisCategory.id], per_page: 7 }).catch(() => null)
//   ]);

//   return (
//     <CategoryPageClient
//       initialPosts={initialArticles?.data || []}
//       highlightArticles={highlightArticles?.data || []}
//       categoryInfo={thisCategory}
//       initialPageInfo={{
//         currentPage: initialArticles?.pagination?.currentPage || 1,
//         lastPage: initialArticles?.pagination?.totalPages || 1,
//         total: initialArticles?.pagination?.totalPosts || 0
//       }}
//       slug={categorySlug}
//     />
//   );
// }