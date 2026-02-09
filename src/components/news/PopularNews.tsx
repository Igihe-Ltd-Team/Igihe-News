import { NewsItem, TraficNews, transformToNewsItem } from '@/types/fetchData'
import React from 'react'
import HeaderDivider from '../HeaderDivider'
import DynamicArticleCard from './DynamicArticleCard'

interface PopularProps {
  articles: TraficNews[]
  name?: string
}




function PopularNews({ articles, name = "Popular News" }: PopularProps) {
  if (!articles || articles.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>No articles available at the moment.</p>
      </div>
    )
  }


  const transformedArticles: NewsItem[] = articles?.map(transformToNewsItem);
// console.log('formated trafics',transformedArticles)

  const featuredArticle = transformedArticles[0]
  const remainingArticles = transformedArticles.slice(1, 5)

  return (
    <section aria-labelledby="popular-news-heading">
      <HeaderDivider title={name}/>
      <div>
        <DynamicArticleCard
          article={featuredArticle}
          showImage
          showHeader
          priority
          imgHeight={246}
          titleStyle="size20"
          showDate={false}
          numbers="01"
          bottomBorder
        />
      </div>
      {remainingArticles.length > 0 && (
        <div className="pt-2">
          {remainingArticles.map((article, index) => (
            <DynamicArticleCard
              key={article.id || `article-${index}`} // Use unique ID
              article={article}
              imgHeight={246}
              leftNumber={`0${index + 2}`} // Fixed: added backtick
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default PopularNews