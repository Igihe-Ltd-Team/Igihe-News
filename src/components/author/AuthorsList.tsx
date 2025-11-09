'use client'

import { AuthorWithPosts } from '@/types/fetchData'
import Link from 'next/link'
import { OptimizedImage } from '../ui/OptimizedImage'

interface AuthorsListProps {
  authors: AuthorWithPosts[]
}

export default function AuthorsList({ authors }: AuthorsListProps) {
  return (
    <div className="min-h-screen bg-light">
      <div className="container py-5">
        <div className="row">
          <div className="col-12">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/">Home</a>
                </li>
                <li className="breadcrumb-item active">Authors</li>
              </ol>
            </nav>

            <h1 className="display-4 fw-bold text-dark mb-4">Our Authors</h1>
            <p className="lead text-muted mb-5">
              Meet our talented team of writers and journalists
            </p>
          </div>
        </div>

        <div className="row g-4">
          {authors.map((author) => (
            <div key={author.id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  {/* Author Avatar */}
                  {author.avatar_urls && (
                    <OptimizedImage
                      src={author.avatar_urls['96']}
                      alt={author.name}
                      width={80}
                      height={80}
                      className="rounded-circle mb-3"
                    />
                  )}

                  <h5 className="card-title mb-2">
                    <Link 
                      href={`/author/${author.slug}`}
                      className="text-decoration-none text-dark"
                    >
                      {author.name}
                    </Link>
                  </h5>

                  {author.description && (
                    <p className="card-text text-muted small mb-3 line-clamp-3">
                      {author.description.length > 120 
                        ? `${author.description.substring(0, 120)}...` 
                        : author.description
                      }
                    </p>
                  )}

                  <div className="d-flex justify-content-center align-items-center gap-3 text-muted small">
                    <span>
                      <strong>{author.post_count || author.recent_posts.length}</strong> articles
                    </span>
                  </div>
                </div>

                {/* Recent Posts */}
                {author.recent_posts.length > 0 && (
                  <div className="card-footer bg-transparent">
                    <h6 className="small fw-bold mb-2">Recent Articles:</h6>
                    <div className="d-flex flex-column gap-1">
                      {author.recent_posts.slice(0, 3).map((post) => (
                        <Link
                          key={post.id}
                          href={`/news/${post.slug}`}
                          className="small text-decoration-none text-truncate"
                          title={post.title.rendered}
                        >
                          {post.title.rendered}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}