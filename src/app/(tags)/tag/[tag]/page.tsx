import TagPageClient from "./TagPageClient";

interface TagsPageProps {
  params: Promise<{ tag: string }>;
}

export default async function TagPage({ params }: TagsPageProps) {
  const { tag } = await params;
  const { ApiService } = await import("@/services/apiService");
  
  const initialArticles = await ApiService.fetchArticles({ 
    tags: [Number(tag)],
    page: 1 
  }).catch(() => null);

  return (
    <TagPageClient
      initialPosts={initialArticles?.data || []}
      initialPageInfo={{
        currentPage: initialArticles?.pagination?.currentPage || 1,
        lastPage: initialArticles?.pagination?.totalPages || 1,
        total: initialArticles?.pagination?.totalPosts || 0
      }}
      tag={Number(tag)}
    />
  );
}