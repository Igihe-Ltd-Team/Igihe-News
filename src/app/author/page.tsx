import { Metadata } from 'next'
import { ApiService } from '@/services/apiService'
import AuthorsList from '@/components/author/AuthorsList'
import { useAuthorData } from '@/hooks/useAuthorData'

export const metadata: Metadata = {
  title: 'Our Authors',
  description: 'Meet our talented team of writers and journalists',
}

export default async function AuthorsPage() {
  return <AuthorsList />
}