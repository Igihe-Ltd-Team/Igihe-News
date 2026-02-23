import React from 'react'
import DynamicArticleCard from '../news/DynamicArticleCard'
import { NewsItem } from '@/types/fetchData'

interface TimeLineProps {
    articles: NewsItem[]
}
export default function TimeLine({ articles }: TimeLineProps) {
    return (
        <div className="px-4 position-relative">
            <div className="position-absolute timeLine-line" />

            {articles.map((item) => (
                <DynamicArticleCard
                    key={item.id || item.slug} // Use stable unique ID
                    isTimeLine
                    article={item}
                    bottomBorder
                    // isSlider
                    className='timeLine-item'
                />
            ))}
        </div>
    )
}
