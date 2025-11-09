import { notFound } from 'next/navigation'
import { ApiService } from '@/services/apiService'
import DynamicArticleCard from '@/components/news/DynamicArticleCard'
import CategoryMainSection from '@/components/news/CategoryMainSection'
import BarAdds from '@/components/ReUsable/BarAdds'
import { Col, Row } from 'react-bootstrap'
import PopularNews from '@/components/news/PopularNews'
import { Category } from '@/types/fetchData'
import HeaderDivider from '@/components/HeaderDivider'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category: Category | null = await ApiService.fetchCategoryBySlug(slug)
  const categoryId = category ? category.id : undefined;
  const articles = await ApiService.fetchArticles({
    categories: categoryId ? [categoryId] : [],
    per_page: 20,
  });

  if (!category) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CategoryMainSection articles={articles.data} />
      <div className='pt-2 pb-4'>
        <BarAdds adds={['1', '2']} />
      </div>

      <div>
        <Row>
          <Col md={8}>
            <HeaderDivider title={'Latest Politics News'}/>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.data.map((article) => (
                <DynamicArticleCard
                  key={article.id}
                  article={article}
                  showImage
                  showExpt
                  imgHeight={160}
                  className='d-flex flex-row gap-3'
                />
              ))}
            </div>
          </Col>
          <Col md={4}>
            <PopularNews articles={articles.data} name={`Popular In ${category.name}`} />
          </Col>
        </Row>
      </div>
    </div>
  )
}