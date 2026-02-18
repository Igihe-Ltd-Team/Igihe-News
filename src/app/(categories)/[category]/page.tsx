import { Category } from "@/types/fetchData";
import CategoryPageClient from "./CategoryPageClient";
import { notFound } from "next/navigation";
import { fetchArticlesByCategory, fetchArticlesByTaHighlight } from "./action";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  try {
    const { prefetchAllHomeData } = await import("@/lib/prefetch-home-data");
    const data = await prefetchAllHomeData();
    
    if (!data.categories || data.categories.length === 0) {
      console.warn("⚠️ No categories found during generateStaticParams");
      return [];
    }

    return data.categories.map((cat: Category) => ({
      category: cat.slug,
    }));
  } catch (error) {
    console.error("❌ Failed to fetch params for categories:", error);
    return [];
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;

  // 1. Get Category List (This should be cached/memoized by Next.js)
  const { prefetchAllHomeData } = await import("@/lib/prefetch-home-data");
  const { ApiService } = await import("@/services/apiService");
  
  const initialData = await prefetchAllHomeData().catch(() => ({ categories: [] }));
  const thisCategory = initialData.categories?.find(
    (single: Category) => single.slug === categorySlug
  );

  if (!thisCategory) notFound();



  const [initialArticles, highlightArticles] = await Promise.all([
    fetchArticlesByCategory(thisCategory.id, 1,20,7),
    fetchArticlesByCategory(thisCategory.id, 1,7),
    // fetchArticlesByTaHighlight(69,thisCategory.id)
  ]);


  return (
    <CategoryPageClient
      key={categorySlug}
      initialPosts={initialArticles?.data || []}
      highlightArticles={highlightArticles?.data || []}
      categoryInfo={thisCategory}
      initialPageInfo={{
        currentPage: initialArticles?.pagination?.currentPage || 1,
        lastPage: initialArticles?.pagination?.totalPages || 1,
        total: initialArticles?.pagination?.totalPosts || 0
      }}
      slug={categorySlug}
    />
  );
}