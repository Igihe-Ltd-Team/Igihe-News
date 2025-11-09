import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ApiService } from '@/services/apiService'
import DynamicArticleCard from '@/components/news/DynamicArticleCard'
import { Col, Row } from 'react-bootstrap'
import HeaderDivider from '@/components/HeaderDivider'
import { Metadata } from 'next'
import AuthorBio from '@/components/author/AuthorBio'
import LoadMoreArticles from '@/components/author/LoadMoreArticles'
import CardAdds from '@/components/ReUsable/CardAdds'
import SocialMedias from '@/components/ReUsable/SocialMedias'
import NewsSkeleton from '@/components/NewsSkeleton'

interface AuthorPageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ page?: string }>
}

export const revalidate = 3600

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
    const { slug } = await params

    try {
        const author = await ApiService.fetchAuthorBySlug(slug)

        if (!author) {
            return {
                title: 'Author Not Found',
                description: 'The requested author could not be found.',
            }
        }

        const articleCount = author.post_count || 0
        const description = author.description ||
            `Read ${articleCount} articles written by ${author.name} on Igihe.com`

        // Safe avatar URL access
        const avatarUrl = author.avatar_urls?.['512'] || 
                         author.avatar_urls?.['96'] || 
                         author.avatar_urls?.['48'] || 
                         author.avatar_urls?.['24']

        return {
            title: `${author.name} - Articles & News | Igihe.com`,
            description,
            openGraph: {
                title: `Articles by ${author.name}`,
                description,
                images: avatarUrl ? [avatarUrl] : [],
                type: 'profile',
            },
            twitter: {
                card: 'summary',
                title: `Articles by ${author.name}`,
                description,
                images: avatarUrl ? [avatarUrl] : [],
            },
        }
    } catch (error) {
        console.error('Error generating metadata:', error)
        return {
            title: 'Author - Igihe.com',
            description: 'Browse articles by author',
        }
    }
}


// Separate component for the main content that can be suspended
async function AuthorContent({ slug, currentPage }: { slug: string; currentPage: number }) {
    const [authorResult, articlesResult] = await Promise.allSettled([
        ApiService.fetchAuthorBySlug(slug),
        ApiService.fetchPostsByAuthorSlug(slug, {
            per_page: 12,
            page: currentPage,
        })
    ])

    // Handle author not found
    const author = authorResult.status === 'fulfilled' ? authorResult.value : null
    if (!author) {
        notFound()
    }

    // Extract data from the response
    const articlesData = articlesResult.status === 'fulfilled'
        ? articlesResult.value
        : { data: [], author: null }

    const articles = articlesData.data || []
    const totalPages = Math.ceil((author.post_count || 0) / 12)

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Author Bio Section */}
            <AuthorBio author={author} />

            {/* Articles Grid + Sidebar */}
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
                            {totalPages > currentPage && (
                                <LoadMoreArticles 
                                    authorSlug={author.slug}
                                    currentPage={currentPage}
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

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
    const { slug } = await params
    const { page = '1' } = await searchParams
    const currentPage = parseInt(page)

    return (
        <Suspense fallback={<NewsSkeleton />}>
            <AuthorContent slug={slug} currentPage={currentPage} />
        </Suspense>
    )
}