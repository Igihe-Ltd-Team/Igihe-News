import { notFound } from 'next/navigation'
import { ApiService } from '@/services/apiService'
import DynamicArticleCard from '@/components/news/DynamicArticleCard'
import CategoryMainSection from '@/components/news/CategoryMainSection'
import BarAdds from '@/components/ReUsable/BarAdds'
import { Col, Row } from 'react-bootstrap'
import PopularNews from '@/components/news/PopularNews'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = await ApiService.fetchCategoryBySlug(slug)
  const articles = await ApiService.fetchArticles({ 
    categories: [category?.id], 
    per_page: 20 
  })

  if (!category) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CategoryMainSection articles={articles.data}/>
      <div className='pt-2 pb-4'>
        <BarAdds adds={['1','2']}/>
      </div>

      <div>
        <Row>
          <Col md={8}></Col>
          <Col md={4}>
            <PopularNews articles={articles.data} name={`Popular In ${category.name}`}/>
          </Col>
        </Row>
      </div>
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