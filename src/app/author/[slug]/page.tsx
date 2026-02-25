import { Metadata } from 'next'
import { ApiService } from '@/services/apiService'
import AuthorsList from '@/components/author/AuthorsList'
import { useAuthorData } from '@/hooks/useAuthorData'
import { getAuthor } from './action'
import AuthorClientPage from './AuthorClientPage'
import NotFound from '@/app/not-found'

interface AuthorPageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ page?: string }>
}

// export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 3600


export default async function AuthorsPage({ params }: AuthorPageProps) {
    const { slug } = await params

    const author = await getAuthor(slug)


    // console.log('byline data',author)


    if (author?.author)
        return <AuthorClientPage
        authorID={author.author.id}
            author={author.author}
            initialPosts={author.postsData?.data || []}
            initialPageInfo={{
                currentPage: author.postsData?.pagination?.currentPage || 1,
                lastPage: author.postsData?.pagination?.totalPages || 1,
                total: author.postsData?.pagination?.totalPosts || 0 
            }}
        />
    return NotFound()
}