import AdvertorialsPageClient from "./AdvertorialsPageClient";

interface OpinionPageProps {
  params: Promise<{ tag: string }>;
}

export default async function OpinionPage({ params }: OpinionPageProps) {
  const { ApiService } = await import("@/services/apiService");
  
  const initialArticles = await ApiService.fetchOtherPosts({ 
    postType:'advertorial',
    page: 1 
  }).catch(() => null);

  return (
    <AdvertorialsPageClient
      initialPosts={initialArticles?.data || []}
      initialPageInfo={{
        currentPage: initialArticles?.pagination?.currentPage || 1,
        lastPage: initialArticles?.pagination?.totalPages || 1,
        total: initialArticles?.pagination?.totalPosts || 0
      }}/>
  );
}