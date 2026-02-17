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

import {  useState, useTransition } from 'react'
import AdManager from '@/components/ads/AdManager'
import { fetchArticlesAuthor } from './action'

interface AuthorPageProps {
    author: Author
    initialPosts: NewsItem[]
    authorID: number
    initialPageInfo: {
        currentPage: number;
        lastPage: number;
        total: number;
    };
}



export default function AuthorClientPage({ author, initialPosts, initialPageInfo, authorID }: AuthorPageProps) {
    const [posts, setPosts] = useState(initialPosts);
    const [pageInfo, setPageInfo] = useState(initialPageInfo);
    const [isPending, startTransition] = useTransition();

    const loadMore = () => {
        if (!author) return null

        if (pageInfo.currentPage >= pageInfo.lastPage) return;

        const nextPage = pageInfo.currentPage + 1;

        startTransition(async () => {

            const result = await fetchArticlesAuthor(authorID, nextPage);
            if (result?.data) {
                setPosts(prevPosts => [...prevPosts, ...result.data]);
                setPageInfo({
                    currentPage: result.pagination.currentPage,
                    lastPage: result.pagination.totalPages,
                    total: result.pagination.totalPosts || 0
                });
            }

        });
    };

    const canLoadMore = pageInfo.currentPage < pageInfo.lastPage;

    // if (isPending) return <NewsSkeleton />

    return (

        <div className="container mx-auto px-4 py-8">
            <AuthorBio author={author} />
            <Row className="g-4">
                <Col lg={9}>
                    <HeaderDivider title={`Latest from ${author.name}`} />

                    {posts.length > 0 ? (
                        <>
                            {posts.map((article) => (
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
                            {canLoadMore && (
                                <div className="text-center mb-8">
                                    <Button
                                        variant="outline-light"
                                        onClick={loadMore}
                                        disabled={isPending}
                                        size="lg"
                                        className="px-8 py-2"
                                        style={{
                                            borderColor: "#1176BB",
                                            color: "#1176BB",
                                        }}
                                    >
                                        {isPending ? (
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

                <Col lg={3}>
                    <AdManager
                        position="home-after-highlights"
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