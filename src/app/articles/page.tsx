
import { fetchArticles } from "./actions";
import ArticlesPageClient from "./ArticlesPageClient";


export default async function ArticlesPage() {
  const [initialArticles, otherArticles] = await Promise.all([
    fetchArticles(1,20,7),
    fetchArticles(1,7),
  ]);


  return (
    <ArticlesPageClient
      key={'1hud'}
      initialPosts={initialArticles?.data || []}
      highlightArticles={otherArticles?.data || []}
      initialPageInfo={{
        currentPage: initialArticles?.pagination?.currentPage || 1,
        lastPage: initialArticles?.pagination?.totalPages || 1,
        total: initialArticles?.pagination?.totalPosts || 0
      }}
    />
  );
}