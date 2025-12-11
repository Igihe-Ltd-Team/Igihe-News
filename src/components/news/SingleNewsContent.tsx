'use client'


import { EnhancedErrorMessage } from '../ui/EnhancedErrorMessage'
import { Col, Container, Row } from 'react-bootstrap'
import { ThemedText } from '../ThemedText'
import { formatDateTime, getCategoryName, getFeaturedImage, getTags, stripHtml } from '@/lib/utils'
import CardAdds from '../ReUsable/CardAdds'
import { OptimizedImage } from '../ui/OptimizedImage'
import SocialMedias from '../ReUsable/SocialMedias'
import AdManager from '../ads/AdManager'
import { NewsItem } from '@/types/fetchData'
import { useNewsData } from '@/hooks/useNewsData'
import DynamicArticleCard from './DynamicArticleCard'
import HeaderDivider from '../HeaderDivider'
import DOMPurify from 'isomorphic-dompurify';


import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { useResponsive } from '@/hooks/useResponsive'
import SingleSkeleton from '../Loading/SingleSkeleton'
import NewsSkeleton from '../NewsSkeleton'
import AIChatButton from './AIChatButton'
import SinglePostMetaData from './SinglePostMetaData'
import SocialShare from './SocialShare'



interface SingleNewsContentProps {
    slug: string,
    initialArticle?: NewsItem
}

export default function SingleNewsContent({ slug, initialArticle }: SingleNewsContentProps) {
    const { isMobile, isTablet, deviceType, width } = useResponsive()


    const { useArticleDetails } = useNewsData()
    const {
        article: post,
        relatedPosts,
        articleLoading,
        refetchArticle,
        relatedPostsLoading
    } = useArticleDetails(slug)

    if (articleLoading) {
        return (
            <div className="min-h-screen d-flex align-items-center justify-content-center">
                <SingleSkeleton />
            </div>
        )
    }

    const article = initialArticle || post

    if (!article) {
        return (
            <div className="container py-5">
                <EnhancedErrorMessage
                    title="Article Not Found"
                    message="The article you're looking for doesn't exist or failed to load."
                    onRetry={() => refetchArticle()}
                    retryText="Try Again"
                    type="error"
                />
            </div>
        )
    }
    const featuredImage = getFeaturedImage(article);

    const articleCategory = article ? getCategoryName(article) : undefined;
    const publishDate = article ? formatDateTime(article.date) : '';
    const author = article._embedded?.author?.[0];
    const authorsName = article._embedded?.author?.[0]?.name || '';
    const authorImage = article._embedded?.author?.[0]?.avatar_urls?.['96'];
    const postUrls = article ? `${process.env.NEXT_PUBLIC_APP_URL}/news/${articleCategory?.toLowerCase()}/${article.slug}` : '';
    const tags = getTags(article)

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
                {/* Render article/post meta data */}
                <SinglePostMetaData
                    author={author}
                    authorName={authorsName}
                    authorImage={authorImage || '/assets/user-avatar.png'}
                    publishDate={publishDate}
                    category={articleCategory} />
                <Row className='pt-4'>

                    <Col md="9">
                        <div className='d-flex'>
                            <Col md="1">
                                <SocialShare postUrl={postUrls} />
                            </Col>
                            <Col md="11">
                                <OptimizedImage
                                    src={featuredImage || '/assets/igiheIcon.png'}
                                    alt={stripHtml(article.title.rendered)}
                                    fill
                                    height={isMobile ? 300 : isTablet ? 400 : 554}
                                    className="object-cover"
                                    imgClass='object-fit-cover'
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
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article?.content?.rendered || '') }}
                                />
                                <div className='d-flex gap-2'>
                                    {
                                        tags.map(tag =>
                                            <div style={{ backgroundColor: '#F7F7F7', borderRadius: 2, padding: 10 }} key={tag.id}>
                                                <ThemedText lightColor='#999999' type='small' darkColor='#999999' style={{ fontSize: 13 }}>
                                                    {
                                                        tag.name
                                                    }
                                                </ThemedText>
                                            </div>
                                        )
                                    }
                                </div>
                                <AIChatButton article={article} />

                                {
                                    relatedPosts.length > 0 &&

                                    <div className='pt-4 pb-4 g-3'>
                                        <HeaderDivider title="Related Articles" />
                                        <div className="position-relative">
                                            <Swiper
                                                spaceBetween={30}
                                                slidesPerView={3}
                                                navigation={{
                                                    nextEl: '.swiper-button-next',
                                                    prevEl: '.swiper-button-prev',
                                                }}
                                                pagination={{
                                                    clickable: true,
                                                    el: '.swiper-pagination',
                                                }}
                                                autoplay={{
                                                    delay: 5000,
                                                    disableOnInteraction: false,
                                                }}
                                                modules={[Navigation, Pagination, Autoplay]}
                                                breakpoints={{
                                                    320: {
                                                        slidesPerView: 2,
                                                        spaceBetween: 10,
                                                    },
                                                    640: {
                                                        slidesPerView: 2,
                                                        spaceBetween: 20,
                                                    },
                                                    1024: {
                                                        slidesPerView: 3,
                                                        spaceBetween: 30,
                                                    },
                                                }}
                                            >
                                                {
                                                    relatedPostsLoading &&
                                                    <NewsSkeleton count={3} />
                                                }
                                                {relatedPosts.map(article => (
                                                    <SwiperSlide key={article.id || article.slug}>
                                                        <DynamicArticleCard
                                                            article={article}
                                                            showImage
                                                            priority={false}
                                                            imgHeight={143}
                                                            bgColor="#1176BB08"
                                                            bordered
                                                            isSlider
                                                        />
                                                    </SwiperSlide>
                                                ))}
                                            </Swiper>
                                            <div className="swiper-button-prev !text-blue-500 !w-10 !h-10 bg-white !rounded-full !shadow-lg after:!text-lg"></div>
                                            <div className="swiper-button-next !text-blue-500 !w-10 !h-10 bg-white !rounded-full !shadow-lg after:!text-lg"></div>

                                            {/* Custom Pagination */}
                                        </div>
                                    </div>
                                }</Col>

                        </div>


                    </Col>
                    <Col md="3" className='position-relative'>
                        <div className='sticky-parent'>
                            <div className='sticky-sidebar'>
                                <AdManager
                                    position="home-after-highlights"
                                    priority={true}
                                    className="mb-2"
                                />
                                <SocialMedias />
                            </div></div>
                    </Col>
                </Row>


            </article>
        </Container>
    )
}
