'use client'

import { useState, useRef, useEffect } from 'react'
import { SearchIcon, CloseIcon } from '@/components/ui/Icons'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useNewsData } from '@/hooks/useNewsData'
import { OptimizedImage } from '../ui/OptimizedImage'
import { useDebounce } from '@/hooks/useDebounce'
import { useQuery } from '@tanstack/react-query'
import { NewsItem } from '@/types/fetchData'
import { formatDate } from '@/lib/utils'

export function SearchBox() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { searchAsync, searchLoading } = useNewsData()

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchAsync({ query: debouncedQuery }),
    enabled: debouncedQuery.length > 2,
  })

  const showResults = isOpen && query.length > 0

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const clearSearch = () => {
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search news..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {(query || isLoading || searchLoading) && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isLoading || searchLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <CloseIcon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {(isLoading || searchLoading) ? (
            <div className="p-4 text-center">
              <LoadingSpinner />
            </div>
          ) : results ? (
            <SearchResults results={results} query={query} onSelect={() => setIsOpen(false)} />
          ) : (
            <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// components/search/SearchResults.tsx
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

// components/search/SearchResultItem.tsx
interface SearchResultItemProps {
  item: NewsItem
  type: 'article' | 'video'
  onSelect: () => void
}

function SearchResultItem({ item, type, onSelect }: SearchResultItemProps) {
  const featuredImage = item._embedded?.['wp:featuredmedia']?.[0]
  
  return (
    <a
      href={`/${type === 'video' ? 'videos' : 'news'}/${item.slug}`}
      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      onClick={onSelect}
    >
      <div className="flex-shrink-0 w-10 h-10 relative rounded overflow-hidden">
        <OptimizedImage
          src={featuredImage?.source_url || '/images/placeholder.jpg'}
          alt={item.title.rendered}
          fill
          sizes="40px"
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
          {item.title.rendered}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
          {type} • {formatDate(item.date)}
        </p>
      </div>
    </a>
  )
}