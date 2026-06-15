"use client"

import React from 'react'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { NewsItem } from '@/types/fetchData'
import DynamicArticleCard from '../news/DynamicArticleCard'

interface SlidesProps {
    articles: NewsItem[],
    showPagination?: boolean,
    showControll?: boolean,
    lgDisplay?:number,
    mdDisplay?:number,
    smDisplay?:number
}


function Slides({ 
    articles, 
    showPagination, 
    showControll,
    lgDisplay = 3,
    mdDisplay = 2,
    smDisplay = 1
}: SlidesProps) {
    return (
        <div className="position-relative mb-2 border-bottom-custom pt-2 pb-2 slider-section">
            <Swiper
                spaceBetween={20}
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
                        slidesPerView: smDisplay,
                        spaceBetween: 10,
                    },
                    640: {
                        slidesPerView: mdDisplay,
                        spaceBetween: 20,
                    },
                    1024: {
                        slidesPerView: lgDisplay,
                        spaceBetween: 30,
                    },
                }}
            >
                {articles.map(article => (
                    <SwiperSlide key={article.id || article.slug}>
                        <DynamicArticleCard
                            key={article.id}
                            article={article}
                            showImage
                            imgHeight={60}
                            titleStyle='small'
                            className='d-flex flex-row gap-3'
                            isSlider
                        />
                    </SwiperSlide>
                ))}
            </Swiper>
            {
                showControll &&
                <>
                    <div className="swiper-button-prev "></div>
                    <div className="swiper-button-next"></div>
                </>
            }

            {
                showPagination &&
                <div className="swiper-pagination swiper-pagination-bottom mt-4"></div>
            }

        </div>
    )
}

export default Slides