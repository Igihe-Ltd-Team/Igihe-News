'use client'

import { cn } from '@/lib/utils'
import { Category } from '@/types/fetchData'

interface NavigationProps {
  categories: Category[]
  selectedCategory: Category | null
  onCategorySelect: (category: Category) => void
  onCategoryHover: (categoryId: number) => void
}

export function Navigation({
  categories,
  selectedCategory,
  onCategorySelect,
  onCategoryHover
}: NavigationProps) {
  return (
    <nav className="hidden md:flex items-center space-x-6">
      <a
        href="/"
        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
      >
        Home
      </a>
      
      {categories.slice(0, 8).map((category) => (
        <a
          key={category.id}
          href={`/category/${category.slug}`}
          onClick={(e) => {
            e.preventDefault()
            onCategorySelect(category)
          }}
          onMouseEnter={() => onCategoryHover(category.id)}
          className={cn(
            'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors',
            selectedCategory?.id === category.id && 'text-blue-600 dark:text-blue-400'
          )}
        >
          {category.name}
        </a>
      ))}
      
      <a
        href="/videos"
        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
      >
        Videos
      </a>
    </nav>
  )
}
