import VideosClientPage from "./VideosClientPage";

interface OpinionPageProps {
  params: Promise<{ tag: string }>;
}

export default async function OpinionPage({ params }: OpinionPageProps) {
  const { ApiService } = await import("@/services/apiService");
  
  const initialArticles = await ApiService.fetchOtherPosts({ 
    postType:'igh-yt-videos',
    page: 1 
  }).catch(() => null);

  return (
    <VideosClientPage
      initialPosts={initialArticles?.data || []}
      initialPageInfo={{
        currentPage: initialArticles?.pagination?.currentPage || 1,
        lastPage: initialArticles?.pagination?.totalPages || 1,
        total: initialArticles?.pagination?.totalPosts || 0
      }}/>
  );
}