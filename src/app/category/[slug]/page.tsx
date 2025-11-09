import { notFound } from 'next/navigation'
import { ApiService } from '@/services/apiService'
import DynamicArticleCard from '@/components/news/DynamicArticleCard'

interface CategoryPageProps {
  params: { slug: string }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await ApiService.fetchCategoryBySlug(params.slug)
  const articles = await ApiService.fetchArticles({ 
    categories: [category.id], 
    per_page: 20 
  })

  if (!category) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600 mt-2">{category.description}</p>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.data.map((article) => (
          <DynamicArticleCard
            key={article.id}
            article={article}
            showImage
            showExpt
          />
        ))}
      </div>
    </div>
  )
}