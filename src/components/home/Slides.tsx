"use client"

import React, { useRef, useState } from 'react'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import type { Swiper as SwiperInstance } from 'swiper'
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
    const swiperRef = useRef<SwiperInstance | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)

    return (
        <div className="position-relative mb-2 border-bottom-custom pt-2 pb-2 slider-section">
            <Swiper
                onSwiper={(swiper) => { swiperRef.current = swiper }}
                onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                spaceBetween={20}
                slidesPerView={3}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}
                modules={[Autoplay]}
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
                    <button
                        type="button"
                        aria-label="Previous slide"
                        className="swiper-button-prev !text-blue-500 !w-10 !h-10 bg-white !rounded-full !shadow-lg after:!text-lg"
                        onClick={() => swiperRef.current?.slidePrev()}
                    />
                    <button
                        type="button"
                        aria-label="Next slide"
                        className="swiper-button-next !text-blue-500 !w-10 !h-10 bg-white !rounded-full !shadow-lg after:!text-lg"
                        onClick={() => swiperRef.current?.slideNext()}
                    />
                </>
            }

            {
                showPagination &&
                <div className="swiper-pagination !bottom-0 mt-4">
                    {articles.map((article, index) => (
                        <button
                            key={article.id || article.slug || index}
                            type="button"
                            aria-label={`Go to slide ${index + 1}`}
                            className={`swiper-pagination-bullet ${activeIndex === index ? 'swiper-pagination-bullet-active' : ''}`}
                            onClick={() => swiperRef.current?.slideTo(index)}
                        />
                    ))}
                </div>
            }

        </div>
    )
}

export default Slides
