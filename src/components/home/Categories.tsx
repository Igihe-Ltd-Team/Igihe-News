import React from 'react'
import HeaderDivider from '../HeaderDivider'
import { Category } from '@/types/fetchData'
import NewsByCategory from './NewsByCategory'

interface CategorySectionProps {
    categories: Category[]
}

export default function Categories({ categories }: CategorySectionProps) {

    return (
        <div className="container p-2">
            <div className="row g-4">

                {
                    categories.slice(0, 4).map((category, i) => (
                        <div className="col-xl-3 col-lg-6 col-md-6" key={i}>
                            <NewsByCategory categoryId={category.id} categoryName={category.name} />
                        </div>
                    ))
                }
            </div>
        </div>
    )
}
