'use client'


import { useQuery } from '@tanstack/react-query'
import { ApiService } from '@/services/apiService'
import { queryKeys } from '@/lib/queryKeys'
import NewsSkeleton from '../NewsSkeleton'
import { EnhancedErrorMessage } from '../ui/EnhancedErrorMessage'
import { Col, Container, Row } from 'react-bootstrap'
import { ThemedText } from '../ThemedText'
import {  getFeaturedImage, stripHtml } from '@/lib/utils'
import CardAdds from '../ReUsable/CardAdds'
import { OptimizedImage } from '../ui/OptimizedImage'
import SocialMedias from '../ReUsable/SocialMedias'
import AdManager from '../ads/AdManager'
import { NewsItem } from '@/types/fetchData'
import { useNewsData } from '@/hooks/useNewsData'

interface SingleNewsContentProps {
    slug: string,
    initialArticle: NewsItem
}

export default function SingleNewsContent({ slug,initialArticle }: SingleNewsContentProps) {
    const { useArticleDetails } = useNewsData()
    const {
    article: clientArticle,
    // relatedPosts,
    // articleLoading,
    // refetchArticle
  } = useArticleDetails(slug)

  const article = clientArticle || initialArticle




    // if (isLoading) {
    //     return (
    //         <div className="min-h-screen d-flex align-items-center justify-content-center">
    //             <NewsSkeleton />
    //         </div>
    //     )
    // }

    // if (error || !post) {
    //     return (
    //         <div className="container py-5">
    //             <EnhancedErrorMessage
    //                 title="Article Not Found"
    //                 message="The article you're looking for doesn't exist or failed to load."
    //                 onRetry={() => refetch()}
    //                 retryText="Try Again"
    //                 type="error"
    //             />
    //         </div>
    //     )
    // }
    const featuredImage = getFeaturedImage(article);



    return (
        <Container>
            <div className='pb-4'>
                <Row>
                    <Col>
                        <AdManager
                            position="header-landscape-ad-1"
                            priority={true}
                            className="mb-2"
                        /></Col>
                    <Col>
                        <AdManager
                            position="header-landscape-ad-2"
                            priority={true}
                            className="mb-2"
                        /></Col>
                </Row>
            </div>

            <article>
                <Col xl="8" md="12">
                    <ThemedText type='title'>{stripHtml(article.title.rendered)}</ThemedText>
                </Col>
                <Row>
                    <Col></Col>
                    <Col></Col>
                </Row>
                <Row className='pt-4'>
                    <Col md="8">
                        <OptimizedImage
                            src={featuredImage || '/images/placeholder.jpg'}
                            alt={article.title.rendered}
                            fill
                            height={554}
                            className="object-cover"
                        />
                        {
                            article?.excerpt?.rendered &&
                            <div className='excerpt-section'>
                                <ThemedText type='defaultItalic'>
                                    {stripHtml(article?.excerpt?.rendered)}
                                </ThemedText>
                            </div>
                        }
                        <div
                            className="post-content"
                            style={{
                                overflow: 'hidden',
                                width: '100%'
                            }}
                            dangerouslySetInnerHTML={{ __html: article?.content?.rendered || '' }}
                        />
                        {/* {post?.content?.rendered && (
                            <div>
                                <ThemedText style={{ whiteSpace: 'pre-wrap' }}>
                                    {stripHtml(post?.content?.rendered)}
                                </ThemedText>
                            </div>
                        )} */}


                        {/* {embeddedYouTubeId && (
                            <iframe
                                src={`https://www.youtube.com/embed/${embeddedYouTubeId}`}
                                frameBorder="0"
                                allowFullScreen
                            />
                        )}

                        {contentImages.map((imageData, index) => (
                            <div key={index} className="pt-2">
                                <div className="text-center">
                                    <div className="position-relative overflow-hidden rounded-4">
                                        <OptimizedImage
                                            src={imageData?.url || '/images/placeholder.jpg'}
                                            alt={imageData?.alt || "Post image"}
                                            fill
                                            height={554}
                                            className="object-cover img-fluid rounded-4"
                                        />
                                    </div>

                                    {(imageData?.caption || imageData?.alt) && (
                                        <div className="mt-2 px-3 py-2 rounded-3">
                                            <ThemedText type='small' className={`text-muted d-block`}>
                                                {imageData?.caption || imageData?.alt}
                                            </ThemedText>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))} */}

                    </Col>
                    <Col md="4">
                        <CardAdds size={290} />
                        <SocialMedias />
                    </Col>
                </Row>


            </article>
        </Container>
    )
}