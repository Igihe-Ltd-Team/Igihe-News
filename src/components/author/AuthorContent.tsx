"use client"

import DynamicArticleCard from '@/components/news/DynamicArticleCard'
import { Col, Row } from 'react-bootstrap'
import HeaderDivider from '@/components/HeaderDivider'
import AuthorBio from '@/components/author/AuthorBio'
import LoadMoreArticles from '@/components/author/LoadMoreArticles'
import CardAdds from '@/components/ReUsable/CardAdds'
import SocialMedias from '@/components/ReUsable/SocialMedias'
import NewsSkeleton from '@/components/NewsSkeleton'
import { useAuthorData } from '@/hooks/useAuthorData'
import { Author, AuthorWithPosts, NewsItem } from '@/types/fetchData'

interface AuthorPageProps {
    author: string
}


// Separate component for the main content that can be suspended
function AuthorContents({ author,articles }: { author:Author,articles:NewsItem[] }) {
    const totalPages = Math.ceil((articles.length || 0) / 12)

    return (
        <div className="container mx-auto px-4 py-8">
            <AuthorBio author={author} />
            <Row className="g-4">
                <Col lg={8}>
                    <HeaderDivider title={`Latest from ${author.name}`} />

                    {articles.length > 0 ? (
                        <>
                            {articles.map((article) => (
                                <DynamicArticleCard
                                    key={article.id || article.slug}
                                    article={article}
                                    showImage
                                    showExpt
                                    imgHeight={160}
                                    titleStyle='size20'
                                    className='d-flex flex-row gap-3'
                                    priority={false}
                                />
                            ))}

                            {/* Load More / Pagination */}
                            {totalPages > 1 && (
                                <LoadMoreArticles 
                                    authorSlug={author.slug}
                                    currentPage={1}
                                    totalPages={totalPages}
                                />
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-lg">
                                No articles found by this author
                            </p>
                        </div>
                    )}
                </Col>

                <Col lg={4}>
                    <CardAdds size={290} />
                    <SocialMedias />
                    {/* <PopularNews /> */}
                </Col>
            </Row>
        </div>
    )
}



export default function AuthorContent({ author }: AuthorPageProps) {
  const { useAuthorWithPosts } = useAuthorData()
  const query = useAuthorWithPosts(author)

  if (query.isLoading) return <NewsSkeleton />
  if (!query.data?.author) return "Author not found"

  return (
    <AuthorContents 
      author={query.data.author}
      articles={query.data.data}
    />
  )
}