import React from 'react'
import { ThemedText } from '../ThemedText'
import Image from 'next/image'
import { NewsItem } from '@/types/fetchData'
import { OptimizedImage } from '../ui/OptimizedImage'
import { getFeaturedImage, stripHtml } from '@/lib/utils'
import Link from 'next/link'

interface opinionProps{
    article:NewsItem
}
export default function OpionCard({article}:opinionProps) {
    return (
        <Link href={`/opinion/article/${article.slug}`} className='text-decoration-none text-reset opion-card d-flex justify-content-between align-items-center mt-2'>
            <div className="w-60 d-flex flex-column gap-2">
                <ThemedText type='defaultSemiBold'>{stripHtml(article.title.rendered)}</ThemedText>
                <ThemedText type='small' className='line-clamp-3'>
                    {
                        stripHtml(article.excerpt.rendered)
                    }
                </ThemedText>
            </div>
            <div className="w-40">
                {/* <OptimizedImage src={getFeaturedImage(article) ||'/images/placeholder.jpg' } height={75} className='option-card-img' alt={''}/> */}
                <Image width={75} src={getFeaturedImage(article) ||'/assets/igiheIcon.png' } height={75} className='option-card-img' style={{objectFit:'cover'}} alt={''} />
            </div>
        </Link>
    )
}