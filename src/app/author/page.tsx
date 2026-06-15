import { Metadata } from 'next'
import AuthorsList from '@/components/author/AuthorsList'

export const metadata: Metadata = {
  title: 'Our Authors',
  description: 'Meet our talented team of writers and journalists',
}

export default function AuthorsPage() {
  return <AuthorsList />
}
