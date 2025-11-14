import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
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
    // Convert children to array for mapping
    const childrenArray = React.Children.toArray(children)
    
    return (
        <div className="position-relative">
            <Swiper
                spaceBetween={spaceBetween}
                slidesPerView={3}
                navigation={showControll ? {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                } : false}
                pagination={showPagination ? {
                    clickable: true,
                    el: '.swiper-pagination',
                } : false}
                autoplay={{
                    delay: autoplayDelay,
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
                    <div className="swiper-button-prev !text-blue-500 !w-10 !h-10 bg-white !rounded-full !shadow-lg after:!text-lg"></div>
                    <div className="swiper-button-next !text-blue-500 !w-10 !h-10 bg-white !rounded-full !shadow-lg after:!text-lg"></div>
                </>
            )}

            {showPagination && (
                <div className="swiper-pagination !bottom-0 mt-4"></div>
            )}
        </div>
    )
}

export default CustomSlider