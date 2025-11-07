'use client'

import { useState } from 'react'
// import { useQuery } from '@tanstack/react-query'
// import { queryKeys } from '@/lib/queryKeys'
// import { ApiService } from '@/services/apiService'
import { ArticleList } from '@/components/news/ArticleList'
import { Category } from '@/types/fetchData'
import { CategoryTabs } from '../ui/CategoryTabs'

interface CategorySectionProps {
  categories: Category[]
  selectedCategory: Category | null
}

export function CategorySection({ categories, selectedCategory }: CategorySectionProps) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(
    selectedCategory || (categories.length > 0 ? categories[0] : null)
  )

  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Latest News
        </h2>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Articles for Selected Category */}
      <div className="mt-6">
        {activeCategory && (
          <ArticleList categoryId={activeCategory.id} />
        )}
      </div>
    </section>
  )
}