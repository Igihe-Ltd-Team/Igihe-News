"use client"

import React from 'react'
import { Category } from '@/types/fetchData'
import { Col, Container, Row } from 'react-bootstrap'
import { useNewsData } from '@/hooks/useNewsData'
import { categoryIcons } from '@/lib/utils'
import NewsSkeleton from '@/components/NewsSkeleton'
import { ThemedText } from '@/components/ThemedText'
import Link from 'next/link'


export default function OurNewsCategories() {
    const { categories, categoriesLoading } = useNewsData()

    if (categoriesLoading)
        return <div className='py-4'><NewsSkeleton /></div>

    return (
        <Container className='py-4'>
            <Row className="g-4">
                {
                    categories.map((category, i) => {
                        const iconInfo = categoryIcons.find(icon => icon.en === category.slug)?.icon;
                        return (
                            <Col md={3} className='feature' key={i}>
                                <div className="feature-icon">
                                    <i className={`bi ${iconInfo}`}></i>
                                </div>
                                <div>
                                    <ThemedText type='subtitle'>{category.name}</ThemedText>
                                </div>
                                <p>{category.description}</p>
                                <Link href={`/news/${category.slug}`} className='text-reset text-decoration-none'>
                                    Read News
                                </Link>
                            </Col>
                        )
                    }
                    )
                }
            </Row>
        </Container>
    )
}
