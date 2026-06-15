"use client"

import React, { useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import type { Swiper as SwiperInstance } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface SlidesProps {
    children: React.ReactNode
    showPagination?: boolean
    showControll?: boolean
    lgDisplay?: number
    mdDisplay?: number
    smDisplay?: number
    spaceBetween?: number
    autoplayDelay?: number
}

function CustomSlider({ 
    children,
    showPagination, 
    showControll,
    lgDisplay = 3,
    mdDisplay = 2,
    smDisplay = 1,
    spaceBetween = 20,
    autoplayDelay = 5000
}: SlidesProps) {
    const childrenArray = React.Children.toArray(children)
    const swiperRef = useRef<SwiperInstance | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    
    return (
        <div className="position-relative video-slider">
            <Swiper
                onSwiper={(swiper) => { swiperRef.current = swiper }}
                onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                spaceBetween={spaceBetween}
                slidesPerView={3}
                autoplay={{
                    delay: autoplayDelay,
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
                        spaceBetween: 15,
                    },
                    1024: {
                        slidesPerView: lgDisplay,
                        spaceBetween: spaceBetween,
                    },
                }}
            >
                {childrenArray.map((child, index) => (
                    <SwiperSlide key={index}>
                        {child}
                    </SwiperSlide>
                ))}
            </Swiper>
            
            {showControll && (
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
            )}

            {showPagination && (
                <div className="swiper-pagination !bottom-0 mt-4">
                    {childrenArray.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            aria-label={`Go to slide ${index + 1}`}
                            className={`swiper-pagination-bullet ${activeIndex === index ? 'swiper-pagination-bullet-active' : ''}`}
                            onClick={() => swiperRef.current?.slideTo(index)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default CustomSlider
