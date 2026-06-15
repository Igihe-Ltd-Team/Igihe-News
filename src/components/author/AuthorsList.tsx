"use client"
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { OptimizedImage } from '../ui/OptimizedImage'
import { ApiService } from '@/services/apiService'
import { Row } from 'react-bootstrap'
import { ThemedText } from '../ThemedText'
import { queryKeys } from '@/lib/queryKeys'
import NewsSkeleton from '../NewsSkeleton'

export default function AuthorsList() {
  const { data: authors, isLoading } = useQuery({
    queryKey: queryKeys.authors.lists(),
    queryFn: () => ApiService.fetchAllAuthors(),
    staleTime: 10 * 60 * 1000,
  })

  if (isLoading) {
    return <NewsSkeleton />
  }

  return (

    <div className="min-h-screen bg-light">
      <div className="container py-5">

        <div className="row">
          <div className="col-12">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link href="/">Home</Link>
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


        <Row className="g-4">
          {
            authors?.map((author) => {
              return (
                <Link href={`/author/${author.slug}`} className='feature col-md-3 text-decoration-none text-dark' key={author.id}>
                  
                    {author.avatar_urls && (
                      <OptimizedImage
                        src={author.avatar_urls['96']}
                        alt={author.name || ''}
                        width={250}
                        height={250}
                        className=" mb-3"
                        imgClass="feature-icon"
                      />
                    )}
                  <div>
                    <ThemedText type='defaultSemiBold'>{author.name}</ThemedText>
                  </div>
                  {/* <p className='line-clamp-3'>{author.description}</p> */}
                </Link>
              )
            }
            )
          }
        </Row>

      </div>
    </div>
  )
}
