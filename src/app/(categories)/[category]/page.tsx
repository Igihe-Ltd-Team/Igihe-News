import { Category } from "@/types/fetchData";
import CategoryPageClient from "./CategoryPageClient";
import { ApiService } from "@/services/apiService";
import { prefetchAllHomeData } from "@/lib/prefetch-home-data";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params
  const initialData = await prefetchAllHomeData()
  const categories = initialData.categories


  const thisCategory = categories?.find(
      (single: Category) => single.slug === category
    );
    if (!thisCategory) {
  throw new Error("Category not found");
}
// console.log('categoryId',thisCategory)
const categoryId = thisCategory?.id
  try {
    // Fetch initial data server-side
    const [ initialArticles, highlightArticles] = await Promise.all([
      ApiService.fetchArticles({categories: [categoryId]}),
      ApiService.fetchArticles({ 
      tags: [63], 
      ...(categoryId && { categories: [categoryId] }),
      per_page: 7 
    }).then(r => r.data)
    ]);

    // console.log('initialArticles',initialArticles)
    // console.log('highlightArticles',highlightArticles)

    // Transform data for client component
    const posts = initialArticles?.data || [];
    const pageInfo = {
      currentPage: initialArticles?.pagination.currentPage || 1,
      lastPage: initialArticles?.pagination.totalPages || 1,
      total: initialArticles?.pagination.totalPosts || 0
    };

    return (
      <CategoryPageClient
        initialPosts={posts}
        highlightArticles={highlightArticles || []}
        categoryInfo={thisCategory}
        initialPageInfo={pageInfo}
        slug={category}
      />
    );
  } catch (error) {
    console.error("Server-side error:", error);
    // You can return an error component or fallback here
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2>Error loading content</h2>
          <p>Please try again later.</p>
        </div>
      </div>
    );
  }
}