'use client'

import { cn } from '@/lib/utils'
import { Category } from '@/types/fetchData'

interface CategoryTabsProps {
  categories: Category[]
  activeCategory: Category | null
  onCategoryChange: (category: Category) => void
  className?: string
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
  className
}: CategoryTabsProps) {
  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <div className={cn('flex space-x-1 overflow-x-auto py-2', className)}>
      {categories.slice(0, 10).map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
            activeCategory?.id === category.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          {category.name}
          {category.count && (
            <span className="ml-2 text-xs opacity-75">
              ({category.count})
            </span>
          )}
        </button>
      ))}
    </div>
  )
}