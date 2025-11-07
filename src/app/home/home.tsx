'use client'


import Categories from '@/components/home/Categories'
import HomeMainSections from '@/components/home/HomeMainSections'
import Recents from '@/components/home/Recents'
import DynamicArticleCard from '@/components/news/DynamicArticleCard'
import NewsSkeleton from '@/components/NewsSkeleton'
import { ThemedText } from '@/components/ThemedText'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { useNewsData } from '@/hooks/useNewsData'
import { useUIStore } from '@/stores/uiStore'
import React from 'react'


export function Home() {
  const {
    categories,
    categoriesLoading,
    featuredArticles,
    featuredArticlesLoading,
    videos,
    videosLoading,
    prefetchCategory
  } = useNewsData()
  const { selectedCategory, setSelectedCategory } = useUIStore()


  if (categoriesLoading && featuredArticlesLoading) {
    return <NewsSkeleton />
  }

  return (
    <>
      <HomeMainSections articles={featuredArticles} />
      <Recents latests={featuredArticles}
        popular={featuredArticles}
        featured={featuredArticles}
        advertorials={featuredArticles} 
      />
      <Categories categories={categories}/>
    </>
  )
}
