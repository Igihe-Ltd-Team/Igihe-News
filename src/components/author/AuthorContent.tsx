"use client"

import DynamicArticleCard from '@/components/news/DynamicArticleCard'
import { Button, Col, Row } from 'react-bootstrap'
import HeaderDivider from '@/components/HeaderDivider'
import AuthorBio from '@/components/author/AuthorBio'
import LoadMoreArticles from '@/components/author/LoadMoreArticles'
import SocialMedias from '@/components/ReUsable/SocialMedias'
import NewsSkeleton from '@/components/NewsSkeleton'
import { useAuthorData } from '@/hooks/useAuthorData'
import { Author, NewsItem } from '@/types/fetchData'
import AdManager from '../ads/AdManager'
import { useEffect, useState } from 'react'

interface AuthorPageProps {
    author: string
}



export default function AuthorContent({ author: slug }: AuthorPageProps) {
    const { usePostsByAuthorSlug } = useAuthorData()
    const [showLoadMore, setShowLoadMore] = useState(false);
    const {
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
        isLoading,
        isError,
        error,
        data,
    } = usePostsByAuthorSlug(slug)
    useEffect(() => {
        if (!isLoading && hasNextPage) {
            setShowLoadMore(true);
        }
    }, [isLoading, hasNextPage]);

    const author = data?.pages?.[0].author || {}
    const articles = data?.pages.flatMap((page) => page.data) || [];



    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };


    if (isLoading) return <NewsSkeleton />

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
                            {/* {totalPages > 1 && (
                                <LoadMoreArticles
                                    authorSlug={author.slug}
                                    currentPage={1}
                                    totalPages={totalPages}
                                />
                            )} */}



                            {showLoadMore && hasNextPage && (
                                <div className="text-center mb-8">
                                    <Button
                                        variant="outline-light"
                                        onClick={handleLoadMore}
                                        disabled={isFetchingNextPage}
                                        size="lg"
                                        className="px-8 py-2"
                                        style={{
                                            borderColor: "#1176BB",
                                            color: "#1176BB",
                                        }}
                                    >
                                        {isFetchingNextPage ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                    aria-hidden="true"
                                                ></span>
                                                Loading...
                                            </>
                                        ) : (
                                            `Load More`
                                        )}
                                    </Button>
                                </div>
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
                    <AdManager
                        position="home-section-1"
                        priority={true}
                        className="mb-2"
                    />
                    <SocialMedias />
                    {/* <PopularNews /> */}
                </Col>
            </Row>
        </div>

    )
}