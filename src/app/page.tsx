import { prefetchHomeData } from '@/lib/prefetch-home-data'
import { Home } from './home/home'
import { PrefetchHomeData } from './prefetch-home-data'


export const revalidate = 300
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    title: 'Home - IGIHE News',
    description: 'IGIHE news brings you the latest and breaking news, trending topics, and discussions from all over the world.',
  }
}

export default async function HomePage() {
  // Only block on above-the-fold data. Below-the-fold server components stream
  // through their Suspense boundaries and use the shared service cache.
  const initialData = await prefetchHomeData()

  return (
    <PrefetchHomeData initialData={initialData}>
      <Home />
    </PrefetchHomeData>
  )
}

// Error boundary
export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong loading the homepage</h2>
      <p className="text-red-600">{error.message}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 btn btn-primary"
      >
        Reload Page
      </button>
    </div>
  )
}
