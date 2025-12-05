// app/news/[post]/page.tsx - TEST VERSION
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface PageProps {
  params: Promise<{ post: string }>
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Simple test metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { post } = await params
  console.log('Generate metadata for post:', post)
  
  return {
    title: `${post} - IGIHE`,
    description: 'Test page',
  }
}

export default async function SingleNewsPage({ params }: PageProps) {
  const { post } = await params
  console.log('Page loading for post:', post)
  
  // Test if the route is accessible
  return (
    <div>
      <h1>Test Page: {post}</h1>
      <p>If you can see this, the route is working.</p>
    </div>
  )
}