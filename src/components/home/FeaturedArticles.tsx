'use client'

import { useUIStore } from '@/stores/uiStore'
import { FeaturedArticlesSkeleton } from './HomepageSkeleton'
import { NewsItem } from '@/types/fetchData'
import { OptimizedImage } from '../ui/OptimizedImage'
import { formatDate } from '@/lib/utils'

interface FeaturedArticlesProps {
  articles: NewsItem[]
  loading?: boolean
}

export function FeaturedArticles({ articles, loading }: FeaturedArticlesProps) {
  const { addToRecentlyViewed } = useUIStore()

  if (loading) {
    return <FeaturedArticlesSkeleton />
  }

  if (!articles || articles.length === 0) {
    return null
  }

  const [featuredArticle, ...otherArticles] = articles

  const handleArticleClick = (article: NewsItem) => {
    addToRecentlyViewed(article)
  }

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Featured News
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Featured Article */}
        <div className="lg:col-span-2">
          <article 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            onClick={() => handleArticleClick(featuredArticle)}
          >
            <a href={`/news/${featuredArticle.slug}`} className="block">
              <div className="relative h-96">
                <OptimizedImage
                  src={featuredArticle._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/placeholder.jpg'}
                  alt={featuredArticle.title.rendered}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-medium">
                      Featured
                    </span>
                    <span className="text-sm opacity-90">
                      {formatDate(featuredArticle.date)}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold leading-tight mb-2 line-clamp-3">
                    {featuredArticle.title.rendered}
                  </h3>
                  <p 
                    className="text-gray-200 line-clamp-2"
                    dangerouslySetInnerHTML={{ 
                      __html: featuredArticle.excerpt?.rendered || '' 
                    }}
                  />
                </div>
              </div>
            </a>
          </article>
        </div>

        {/* Secondary Featured Articles */}
        <div className="space-y-6">
          {otherArticles.slice(0, 3).map((article, index) => (
            <article 
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              onClick={() => handleArticleClick(article)}
            >
              <a href={`/news/${article.slug}`} className="block">
                <div className="flex space-x-4">
                  <div className="flex-shrink-0 w-24 h-24 relative">
                    <OptimizedImage
                      src={article._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/placeholder.jpg'}
                      alt={article.title.rendered}
                      fill
                      className="object-cover rounded"
                      sizes="96px"
                    />
                  </div>
                  <div className="flex-1 py-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                      {article.title.rendered}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(article.date)}
                    </p>
                  </div>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}