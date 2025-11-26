"use client"
import { Author, AuthorWithPosts } from '@/types/fetchData'
import Link from 'next/link'
import { OptimizedImage } from '../ui/OptimizedImage'
import { ApiService } from '@/services/apiService'
import { Col, Row } from 'react-bootstrap'
import { ThemedText } from '../ThemedText'
import { useAuthorData } from '@/hooks/useAuthorData'
import NewsSkeleton from '../NewsSkeleton'


export default async function AuthorsList() {
  // const authors = await ApiService.fetchAllAuthors()

  const {useAllAuthors} = useAuthorData()

  const { data: authors, isLoading, error } = useAllAuthors()

// console.log('authors',authors)
if(isLoading)
  return <NewsSkeleton/>
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


        <Row className="g-4">
          {
            authors?.map((author) => {
              return (
                <Link href={`/author/${author.slug}`} className='feature col-md-4 text-decoration-none text-dark' key={author.id}>
                  <div className="feature-icon">
                    {author.avatar_urls && (
                      <OptimizedImage
                        src={author.avatar_urls['96']}
                        alt={author.name}
                        width={40}
                        height={40}
                        className="rounded-circle mb-3"
                        imgClass="feature-icon"
                      />
                    )}
                  </div>
                  <div>
                    <ThemedText type='defaultSemiBold'>{author.name}</ThemedText>
                  </div>
                  <p className='line-clamp-3'>{author.description}</p>
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