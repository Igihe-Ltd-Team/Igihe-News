import { notFound, permanentRedirect } from 'next/navigation'
import { resolveAuthorSlug } from '@/lib/sitemap/authors'
import { getAuthor } from './action'
import AuthorClientPage from './AuthorClientPage'

interface AuthorPageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ page?: string }>
}

// export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 3600


export default async function AuthorsPage({ params }: AuthorPageProps) {
    const { slug } = await params

    // Duplicate byline spellings (al-jaazeera, al-jzeera, …) live at one URL.
    const canonicalSlug = resolveAuthorSlug(slug)
    if (canonicalSlug !== slug) permanentRedirect(`/author/${canonicalSlug}`)

    const author = await getAuthor(slug)

    if (author?.author)
        return <AuthorClientPage
            authorID={author.bylineIds}
            author={author.author}
            initialPosts={author.postsData?.data || []}
            initialPageInfo={{
                currentPage: author.postsData?.pagination?.currentPage || 1,
                lastPage: author.postsData?.pagination?.totalPages || 1,
                total: author.postsData?.pagination?.totalPosts || 0
            }}
        />
    notFound()
}
