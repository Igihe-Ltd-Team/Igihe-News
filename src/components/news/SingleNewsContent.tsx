'use client'



import { EnhancedErrorMessage } from '../ui/EnhancedErrorMessage'
import { Col, Container, Row } from 'react-bootstrap'
import { ThemedText } from '../ThemedText'
import { extractImagesFromHtml, formatDateTime, getCategoryName, getCategorySlug, getFeaturedImage, getTags, injectGalleryImages, stripHtml } from '@/lib/utils'
import CardAdds from '../ReUsable/CardAdds'
import { OptimizedImage } from '../ui/OptimizedImage'
import SocialMedias from '../ReUsable/SocialMedias'
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
import CustomSlider from '../home/CustomSlider'
import { visby } from '@/lib/fonts';
import SideBar from '../ReUsable/SideBar'
import AdManager from '../ads/AdManager'
import CommentsSection from './CommentsSection'
import { useEffect, useState } from 'react'
import Lightbox from '../lightbox/LightBox'
import { usePostContentLightbox } from '../lightbox/Uselightbox'


interface SingleNewsContentProps {
    slug: string,
    initialArticle?: NewsItem
}


const parseCustomMarkup = (content: string) => {
    if (!content) return '';

    return content
        // Convert [text->url] to <a href="url">text</a>
        .replace(/\[([^\]]+)->([^\]]+)\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        // Convert {{text}} to <strong>text</strong>
        .replace(/\{\{([^}]+)\}\}/g, '<strong>$1</strong>')
        .replace(/&#8217;/g, "'")
        .replace(/&#8216;/g, "'")   // opening single quote
        .replace(/&#8220;/g, '"')   // opening double quote
        .replace(/&#8221;/g, '"')   // closing double quote
        .replace(/&#8211;/g, '–')   // en dash
        .replace(/&#8212;/g, '—')   // em dash
        .replace(/&#038;/g, '&')    // ampersand
        .replace(/&amp;/g, '&')     // ampersand (named)
        // Convert [text->url] to <a>
        .replace(/\[([^\]]+)->([^\]]+)\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        // Convert {{text}} to <strong>
        .replace(/\{\{([^}]+)\}\}/g, '<strong>$1</strong>');
};


export default function SingleNewsContent({ slug, initialArticle }: SingleNewsContentProps) {
    const { isMobile, isTablet, deviceType, width } = useResponsive()
    const [isClient, setIsClient] = useState(false)

    const { useArticleDetails } = useNewsData()

    useEffect(() => {
        setIsClient(true)
    }, [])

    const {
        article: post,
        relatedPosts,
        articleLoading,
        refetchArticle,
        relatedPostsLoading
    } = useArticleDetails(slug,
        {
            initialData: initialArticle,
            enabled: isClient
        }
    )

    if (articleLoading) {
        return (
            <div className="min-h-screen d-flex align-items-center justify-content-center">
                <SingleSkeleton />
            </div>
        )
    }

    const article = post || initialArticle

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
    const featuredImage = getFeaturedImage(article, true);

    const articleCategory = article ? getCategoryName(article) : undefined;
    const articleCategorySlug = article ? getCategorySlug(article) : undefined;
    const publishDate = article ? formatDateTime(article.date) : '';
    const author = article.bylines;
    const authorsName = article.bylines?.[0]?.name || '';
    const authorImage = article.bylines?.[0]?.image;
    const postUrls = article ? `${process.env.NEXT_PUBLIC_APP_URL}/${articleCategory?.toLowerCase()}/article/${article.slug}` : '';
    const tags = getTags(article)

    const imgs = extractImagesFromHtml(article?.content?.rendered || "")
    // console.log('post imgs', imgs)

    const { containerRef, lightboxProps } = usePostContentLightbox(imgs);

    return (
        <Container>
            <div className='pb-md-4'>
                <CustomSlider
                    lgDisplay={2}
                    mdDisplay={2}
                    smDisplay={1}
                >
                    <AdManager
                        position="premium_leaderboard_1"
                        priority={true}
                    //   className="mb-2"
                    />
                    <AdManager
                        position="header-landscape-ad-2"
                        priority={true}
                    //   className="mb-2"
                    />
                </CustomSlider>
            </div>

            <article>
                <Col xl="12" md="12">
                    <ThemedText type='title'>{stripHtml(article.title.rendered)}</ThemedText>
                </Col>
                {/* Render article/post meta data */}
                <SinglePostMetaData
                    author={author}
                    authorName={authorsName}
                    authorImage={authorImage || '/assets/user-avatar.png'}
                    publishDate={publishDate}
                    category={articleCategory}
                    categorySlug={articleCategorySlug}
                />
                <Row className='pt-4'>

                    <Col md="9">
                        <div className='d-flex flex-column-reverse flex-md-row'>
                            <Col md="1">
                                <div className='sticky-parent'>
                                    <div className='sticky-sidebar'>
                                        <SocialShare postUrl={postUrls} />
                                    </div>
                                </div>
                            </Col>
                            <Col md="11">
                                <OptimizedImage
                                    src={featuredImage || '/assets/igiheIcon.png'}
                                    alt={stripHtml(article.title.rendered)}
                                    fill
                                    height={isMobile ? 300 : isTablet ? 400 : 554}
                                    className="object-cover"
                                    imgClass='object-fit-cover'
                                    priority
                                />
                                {
                                    article?.excerpt?.rendered &&
                                    <div className='excerpt-section'>
                                        <ThemedText type='defaultItalic' className='excerpt-text'>
                                            {stripHtml(article?.excerpt?.rendered)}
                                        </ThemedText>
                                    </div>
                                }
                                <div
                                    ref={containerRef}
                                    className="post-content font-visby"
                                    style={{ overflow: 'hidden', width: '100%' }}
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(
                                            parseCustomMarkup(article?.content?.rendered || ''),
                                            {
                                                ADD_TAGS: ['iframe'],
                                                ADD_ATTR: ['allowfullscreen', 'frameborder', 'src', 'allow', 'loading']
                                            }
                                        )
                                    }}
                                />
                                <Lightbox {...lightboxProps} />

                                {/* <div className='d-flex gap-2'>
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
                                </div> */}
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
                                                            showCategorie={!isMobile}
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


                        {article && (
                            <CommentsSection
                                articleId={article.id}
                                articleTitle={stripHtml(article.title.rendered)}
                            />
                        )}

                    </Col>
                    <Col md="3" className='position-relative'>
                        <SideBar
                            hasBanner
                            showSocials
                        />
                    </Col>
                </Row>


            </article>
        </Container>
    )
}
