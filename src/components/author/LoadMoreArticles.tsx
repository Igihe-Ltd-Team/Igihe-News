'use client'

import Link from 'next/link'

interface LoadMoreArticlesProps {
    authorSlug: string
    currentPage: number
    totalPages: number
}

export default function LoadMoreArticles({ 
    authorSlug, 
    currentPage, 
    totalPages 
}: LoadMoreArticlesProps) {
    const nextPage = currentPage + 1
    
    return (
        <div className="text-center mt-5">
            <Link 
                href={`/author/${authorSlug}?page=${nextPage}`}
                className="btn btn-primary btn-lg"
            >
                Load More Articles
            </Link>
            <p className="text-muted mt-2 small">
                Page {currentPage} of {totalPages}
            </p>
        </div>
    )
}