import React from 'react'
import HeaderDivider from '../HeaderDivider'
import { ApiService } from '@/services/apiService'
import ClientCategoryData from './ClientCategoryData'

interface ArticleListProps {
    categoryId: number,
    categoryName?: string
    categorySlug?: string
}
export default async function NewsByCategory({ categoryId, categoryName, categorySlug }: ArticleListProps) {


    const articles = await ApiService.fetchArticles({ categories: [categoryId],tags_exclude:[70,69,133,72,151,80,101,99] })

    return (
        <div>
            <HeaderDivider title={categoryName} titleStyle={'size20'} slug={categorySlug} />
            <ClientCategoryData articles={articles.data} />
        </div>
    )
}
