import React from 'react'
import HeaderDivider from '../HeaderDivider'
import { Category } from '@/types/fetchData'
import NewsByCategory from './NewsByCategory'

interface CategorySectionProps {
    categories: {
        id:number
        name:string
        slug:string
    }[]
}

export default function Categories({ categories }: CategorySectionProps) {

    return (
        <div className="container p-2">
            <div className="row g-4">
                {/* <div className="col-xl-3 col-lg-6 col-md-6">
                    <NewsByCategory categoryId={5} categoryName={'International'} />
                </div>
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <NewsByCategory categoryId={8} categoryName={'Science technology'} />
                </div>
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <NewsByCategory categoryId={10} categoryName={'Sports'} />
                </div>
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <NewsByCategory categoryId={9} categoryName={'Health'} />
                </div> */}

                {
                    categories.slice(0, 4).map((category, i) => (
                        <div className="col-xl-3 col-lg-6 col-md-6" key={i}>
                            <NewsByCategory categoryId={category.id} categoryName={category.name} categorySlug={category.slug} />
                        </div>
                    ))
                }
            </div>
        </div>
    )
}