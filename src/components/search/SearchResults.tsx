import { NewsItem } from "@/types/fetchData"

interface SearchResultsProps {
  results: any
  query: string
  onSelect: () => void
}

function SearchResults({ results, query, onSelect }: SearchResultsProps) {
  const articles = results.posts || []
  const videos = results.videos || []
  const hasResults = articles.length > 0 || videos.length > 0

  if (!hasResults) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
        No results found for "{query}"
      </div>
    )
  }

  return (
    <div className="p-2">
      {articles.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 px-2">
            Articles ({articles.length})
          </h3>
          <div className="space-y-1">
            {articles.slice(0, 5).map((article: NewsItem) => (
              <SearchResultItem
                key={article.id}
                item={article}
                type="article"
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}
      
      {videos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 px-2">
            Videos ({videos.length})
          </h3>
          <div className="space-y-1">
            {videos.slice(0, 5).map((video: NewsItem) => (
              <SearchResultItem
                key={video.id}
                item={video}
                type="video"
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}
      
      {(articles.length > 5 || videos.length > 5) && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <a
            href={`/search?q=${encodeURIComponent(query)}`}
            className="block text-center text-blue-600 dark:text-blue-400 hover:underline py-2 text-sm"
            onClick={onSelect}
          >
            View all results
          </a>
        </div>
      )}
    </div>
  )
}
