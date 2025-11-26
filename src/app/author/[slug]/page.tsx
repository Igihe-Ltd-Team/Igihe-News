import { Metadata } from 'next'
import { ApiService } from '@/services/apiService'
import AuthorsList from '@/components/author/AuthorsList'
import { useAuthorData } from '@/hooks/useAuthorData'
import AuthorContent from '@/components/author/AuthorContent'

interface AuthorPageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ page?: string }>
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
    const { slug } = await params

    try {
        const author = await ApiService.fetchAuthorBySlug(slug)

        if (!author) {
            return {
                title: 'Author Not Found',
                description: 'The requested author could not be found.',
            }
        }

        const articleCount = author.post_count || 0
        const description = author.description ||
            `Read ${articleCount} articles written by ${author.name} on Igihe.com`

        // Safe avatar URL access
        const avatarUrl = author.avatar_urls?.['512'] || 
                         author.avatar_urls?.['96'] || 
                         author.avatar_urls?.['48'] || 
                         author.avatar_urls?.['24']

        return {
            title: `${author.name} - Articles & News | Igihe.com`,
            description,
            openGraph: {
                title: `Articles by ${author.name}`,
                description,
                images: avatarUrl ? [avatarUrl] : [],
                type: 'profile',
            },
            twitter: {
                card: 'summary',
                title: `Articles by ${author.name}`,
                description,
                images: avatarUrl ? [avatarUrl] : [],
            },
        }
    } catch (error) {
        console.error('Error generating metadata:', error)
        return {
            title: 'Author - Igihe.com',
            description: 'Browse articles by author',
        }
    }
}

export default async function AuthorsPage({params}:AuthorPageProps) {
    const { slug } = await params
  return <AuthorContent author={slug}/>
}