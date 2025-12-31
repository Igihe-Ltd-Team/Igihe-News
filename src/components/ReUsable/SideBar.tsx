import React from 'react'
import SocialMedias from './SocialMedias'
import { NewsItem } from '@/types/fetchData'
import PopularNews from '../news/PopularNews'
import AdManager from '../ads/AdManager'

interface SideBarProps {
    hasBanner?: boolean
    posts?: NewsItem[]
    showSocials?: boolean
    categoryInfo?: any
    slug?: string
}

function SideBar({ hasBanner, posts = [], showSocials, categoryInfo, slug }: SideBarProps) {
    return (
        <div className='sticky-parent'>
            <div className='sticky-sidebar'>
                {
                    hasBanner && <AdManager
                        position="home-after-highlights"
                        priority={true}
                        className="mb-2"
                    />
                }
                {
                    posts?.length > 0 &&
                    <PopularNews
                        articles={posts}
                        name={`Popular In ${categoryInfo?.name || slug}`}
                    />
                }
                {
                    showSocials && <SocialMedias />
                }

            </div>
        </div>
    )
}

export default SideBar