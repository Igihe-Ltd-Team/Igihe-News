'use client'

import { useAuthorData } from '@/hooks/useAuthorData'
import { formatDate } from '@/lib/utils'
import NewsSkeleton from '../NewsSkeleton'
import { EnhancedErrorMessage } from '../ui/EnhancedErrorMessage'
import { OptimizedImage } from '../ui/OptimizedImage'
import { ThemedText } from '../ThemedText'
import DynamicArticleCard from '../news/DynamicArticleCard'

interface AuthorContentProps {
  slug: string
}

export default function AuthorContent({ slug }: AuthorContentProps) {
  const { 
    useAuthorBySlug, 
    usePostsByAuthorSlug 
  } = useAuthorData()

  const { 
    data: author, 
    isLoading: authorLoading, 
    error: authorError 
  } = useAuthorBySlug(slug)

  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePostsByAuthorSlug(slug, { per_page: 12 })

  if (authorLoading || postsLoading) {
    return (
      <div className="min-h-screen d-flex align-items-center justify-content-center">
        <NewsSkeleton/>
      </div>
    )
  }

  if (authorError || !author) {
    return (
      <div className="container py-5">
        <EnhancedErrorMessage
          title="Author Not Found"
          message="The author you're looking for doesn't exist."
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  // Safely access posts data
  const allPosts = postsData?.pages?.flatMap(page => page?.data || []) || []

  return (
    <div className="min-h-screen bg-light">
      <div className="container py-5">
        {/* Author Header */}
        <div className="row mb-5">
          <div className="col-12">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/">Home</a>
                </li>
                <li className="breadcrumb-item">
                  <a href="/authors">Authors</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {author?.name || 'Unknown Author'}
                </li>
              </ol>
            </nav>
          </div>

          <div className="col-md-3 text-center text-md-start">
            {/* Author Avatar - Safe access */}
            {author?.avatar_urls && (
              <div className="mb-3">
                <OptimizedImage
                  src={author.avatar_urls['96']}
                  alt={author.name}
                  width={120}
                  height={120}
                  className="rounded-circle img-thumbnail"
                />
              </div>
            )}
          </div>

          <div className="col-md-9">
            <h1 className="display-5 fw-bold text-dark mb-3">
              {author?.name || 'Unknown Author'}
            </h1>

            {author?.description && (
              <div className="lead text-muted mb-4">
                <ThemedText>{author.description}</ThemedText>
              </div>
            )}

            <div className="d-flex flex-wrap align-items-center gap-4 text-muted">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-file-text"></i>
                <span>
                  <strong>{author?.post_count || allPosts.length}</strong> articles
                </span>
              </div>

              {author?.registered_date && (
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-calendar"></i>
                  <span>
                    Member since {formatDate(author.registered_date)}
                  </span>
                </div>
              )}

              {author?.roles && author.roles.length > 0 && (
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-person-badge"></i>
                  <span className="text-capitalize">
                    {author.roles.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        {postsError ? (
          <EnhancedErrorMessage
            title="Failed to Load Articles"
            message="There was an error loading the articles by this author."
            onRetry={() => window.location.reload()}
          />
        ) : allPosts.length === 0 ? (
          <div className="text-center py-5">
            <h3 className="text-muted">No articles found</h3>
            <p className="text-muted">
              {author?.name || 'This author'} hasn't published any articles yet.
            </p>
          </div>
        ) : (
          <>
            <div className="row">
              <div className="col-12">
                <h2 className="h4 fw-bold mb-4">
                  Articles by {author?.name || 'this author'}
                </h2>
              </div>
            </div>

            <div className="row g-4">
              {allPosts.map((post) => (
                <div key={post?.id || Math.random()} className="col-12 col-md-6 col-lg-4">
                  <DynamicArticleCard
                    article={post}
                    showImage
                    showExpt
                  />
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="text-center mt-5">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="btn btn-primary btn-lg"
                >
                  {isFetchingNextPage ? (
                    <NewsSkeleton/>
                  ) : (
                    'Load More Articles'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}