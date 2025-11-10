import { Metadata } from 'next'
import { ApiService } from '@/services/apiService'
import AuthorsList from '@/components/author/AuthorsList'

export const metadata: Metadata = {
  title: 'Our Authors',
  description: 'Meet our talented team of writers and journalists',
}

export default async function AuthorsPage() {
  const authors = await ApiService.fetchAuthorsWithPosts(50)

  return <AuthorsList authors={authors} />
}