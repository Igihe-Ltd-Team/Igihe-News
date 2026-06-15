import CategoryPageClient from "./CategoryPageClient";
import { notFound } from "next/navigation";
import { fetchArticlesByCategory } from "./action";
import { ApiService } from "@/services/apiService";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  try {
    const categories = await ApiService.fetchCategories({ per_page: 100 });
    
    if (categories.length === 0) {
      console.warn("⚠️ No categories found during generateStaticParams");
      return [];
    }

    return categories.map((cat) => ({
      category: cat.slug,
    }));
  } catch (error) {
    console.error("❌ Failed to fetch params for categories:", error);
    return [];
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const thisCategory = await ApiService.fetchCategoryBySlug(categorySlug).catch(() => null);

  if (!thisCategory) notFound();

  const [initialArticles, highlightArticles] = await Promise.all([
    fetchArticlesByCategory(thisCategory.id, 1,20,7),
    fetchArticlesByCategory(thisCategory.id, 1,7),
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
