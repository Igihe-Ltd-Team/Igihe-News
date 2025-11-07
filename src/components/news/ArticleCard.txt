'use client'

import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { BookmarkIcon, BookmarkFilledIcon, ShareIcon } from '@/components/ui/Icons'
import { useUIStore } from '@/stores/uiStore'
import { cn, formatDate } from '@/lib/utils'
import { NewsItem } from '@/types/fetchData'
// import { cn } from '@/lib/utils'

interface ArticleCardProps {
  article: NewsItem
  priority?: boolean
  variant?: 'default' | 'featured' | 'compact'
  className?: string
}

export function ArticleCard({ 
  article, 
  priority = false,
  variant = 'default',
  className 
}: ArticleCardProps) {
  const { bookmarks, toggleBookmark, addToRecentlyViewed } = useUIStore()
  
  const isBookmarked = bookmarks.some(b => b.id === article.id)
  const featuredImage = article._embedded?.['wp:featuredmedia']?.[0]
  const categories = article._embedded?.['wp:term']?.[0] || []

  const handleClick = () => {
    addToRecentlyViewed(article)
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleBookmark(article)
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title.rendered,
          url: `/news/${article.slug}`
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/news/${article.slug}`)
      // You could show a toast notification here
    }
  }

  if (variant === 'compact') {
    return (
      <article 
        className={cn(
          'flex space-x-4 bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow',
          className
        )}
        onClick={handleClick}
      >
        <div className="flex-shrink-0 w-20 h-20 relative rounded overflow-hidden">
          <OptimizedImage
            src={featuredImage?.source_url || '/images/placeholder.jpg'}
            alt={article.title.rendered}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
            <a href={`/news/${article.slug}`} className="hover:text-blue-600 transition-colors">
              {article.title.rendered}
            </a>
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(article.date)}
          </p>
        </div>
      </article>
    )
  }

  if (variant === 'featured') {
    return (
      <article 
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1',
          className
        )}
        onClick={handleClick}
      >
        <div className="relative aspect-[16/9]">
          <OptimizedImage
            src={featuredImage?.source_url || '/images/placeholder.jpg'}
            alt={article.title.rendered}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-4 left-4 flex space-x-2">
            {categories.slice(0, 2).map(category => (
              <span
                key={category.id}
                className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium"
              >
                {category.name}
              </span>
            ))}
          </div>
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={handleBookmark}
              className="bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full transition-colors"
            >
              {isBookmarked ? (
                <BookmarkFilledIcon className="w-4 h-4" />
              ) : (
                <BookmarkIcon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleShare}
              className="bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full transition-colors"
            >
              <ShareIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="text-xl font-bold leading-tight mb-2 line-clamp-2">
              <a href={`/news/${article.slug}`} className="hover:text-blue-200 transition-colors">
                {article.title.rendered}
              </a>
            </h3>
            <p 
              className="text-gray-200 line-clamp-2 mb-2"
              dangerouslySetInnerHTML={{ 
                __html: article.excerpt?.rendered || '' 
              }}
            />
            <div className="flex items-center justify-between text-sm">
              <span>{formatDate(article.date)}</span>
              <span>{Math.ceil((article.content?.rendered.length || 0) / 1000)} min read</span>
            </div>
          </div>
        </div>
      </article>
    )
  }

  // Default variant
  return (
    <article 
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300',
        className
      )}
      onClick={handleClick}
    >
      <div className="relative aspect-video">
        <OptimizedImage
          src={featuredImage?.source_url || '/images/placeholder.jpg'}
          alt={article.title.rendered}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="absolute top-3 left-3 flex space-x-1">
          {categories.slice(0, 1).map(category => (
            <span
              key={category.id}
              className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium"
            >
              {category.name}
            </span>
          ))}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
          <a 
            href={`/news/${article.slug}`}
            className="hover:text-blue-600 transition-colors"
          >
            {article.title.rendered}
          </a>
        </h3>
        <p 
          className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3"
          dangerouslySetInnerHTML={{ 
            __html: article.excerpt?.rendered || '' 
          }}
        />
        
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{formatDate(article.date)}</span>
          <div className="flex space-x-2">
            <button
              onClick={handleBookmark}
              className="hover:text-blue-600 transition-colors"
            >
              {isBookmarked ? (
                <BookmarkFilledIcon className="w-4 h-4" />
              ) : (
                <BookmarkIcon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleShare}
              className="hover:text-blue-600 transition-colors"
            >
              <ShareIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}