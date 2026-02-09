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


    const articles = await ApiService.fetchArticles({ categories: [categoryId] })

    return (
        <div>
            <HeaderDivider title={categoryName} titleStyle={'size20'} slug={categorySlug} />
            <ClientCategoryData articles={articles.data} />
        </div>
    )
}
