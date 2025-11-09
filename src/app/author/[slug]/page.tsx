import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ApiService } from '@/services/apiService'
import DynamicArticleCard from '@/components/news/DynamicArticleCard'
import CategoryMainSection from '@/components/news/CategoryMainSection'
import BarAdds from '@/components/ReUsable/BarAdds'
import { Col, Row } from 'react-bootstrap'
import PopularNews from '@/components/news/PopularNews'
import { Author, NewsItem } from '@/types/fetchData'
import HeaderDivider from '@/components/HeaderDivider'
import { Metadata } from 'next'
// import AuthorBio from '@/components/author/AuthorBio'
// import LoadMoreArticles from '@/components/author/LoadMoreArticles'
import NewsSkeleton from '@/components/NewsSkeleton'
import CardAdds from '@/components/ReUsable/CardAdds'
import SocialMedias from '@/components/ReUsable/SocialMedias'

interface AuthorPageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ page?: string }>
}

// Generate static params for popular authors
// export async function generateStaticParams() {
//     try {
//         const authors = await ApiService.fetchAuthors({ per_page: 20 })
//         return authors.map((author) => ({
//             slug: author.slug,
//         }))
//     } catch (error) {
//         console.error('Error generating static params:', error)
//         return []
//     }
// }

// ISR - Revalidate every hour
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

        return {
            title: `${author.name} - Articles & News | Igihe.com`,
            description,
            openGraph: {
                title: `Articles by ${author.name}`,
                description,
                images: author.avatar_urls?.['512'] ? [author.avatar_urls['512']] : [],
                type: 'profile',
            },
            twitter: {
                card: 'summary',
                title: `Articles by ${author.name}`,
                description,
                images: author.avatar_urls?.['512'] ? [author.avatar_urls['512']] : [],
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

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
    const { slug } = await params
    const { page = '1' } = await searchParams
    const currentPage = parseInt(page)

    // Fetch author and articles in parallel
    const [authorResult, articlesResult, popularResult] = await Promise.allSettled([
        ApiService.fetchAuthorBySlug(slug),
        ApiService.fetchPostsByAuthorId(undefined, { 
            per_page: 12,
            page: currentPage,
            author_slug: slug
        }),
        ApiService.fetchArticles({ 
            per_page: 5, 
            orderby: 'views'
        })
    ])

    // Handle author not found
    const author = authorResult.status === 'fulfilled' ? authorResult.value : null
    if (!author) {
        notFound()
    }

    // Get articles
    const articlesData = articlesResult.status === 'fulfilled' 
        ? articlesResult.value 
        : { data: [], total_pages: 1 }

    const articles = articlesData
    const totalPages = articlesData.total_pages

    const popular = popularResult.status === 'fulfilled'
        ? popularResult.value.data
        : []


    return (
        <div className="container mx-auto px-4 py-8">
            {/* Author Bio Section */}
            {/* <AuthorBio author={author} /> */}


            {/* Articles Grid + Sidebar */}
            <Row className="g-4">
                <Col lg={8}>
                    <HeaderDivider title={`Latest from ${author.name}`}/>
                    
                    {articles?.length > 0 ? (
                        <>
                                {articles?.map((article) => (
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
                            {/* {totalPages > currentPage && (
                                <LoadMoreArticles 
                                    authorId={author.id}
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                />
                            )} */}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-lg">
                                No more articles found
                            </p>
                        </div>
                    )}
                </Col>

                <Col lg={4}>
                    <CardAdds size={290} />
                    <SocialMedias/>
                </Col>
            </Row>
        </div>
    )
}