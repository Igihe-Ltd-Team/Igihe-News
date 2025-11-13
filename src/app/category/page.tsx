"use client"
import { Metadata } from 'next'
import { useNewsData } from '@/hooks/useNewsData'
import { Container } from 'react-bootstrap'

// export const metadata: Metadata = {
//   title: 'IGIHE News Categories',
//   description: 'IGIHE news sections and categories',
// }

export default function CategoriesPage() {
  const {categories} = useNewsData()

  return(
    <Container>
    {
        categories.map(category=><p>{category.name}</p>)
    }
    </Container>
  )
}