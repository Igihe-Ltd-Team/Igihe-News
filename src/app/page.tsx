
import { prefetchHomeData } from '@/lib/prefetch-home-data'
import { PrefetchHomeData } from './prefetch-home-data'
import { Home } from './home/home'

// Enable ISR with revalidation every 5 minutes
export const revalidate = 300

// Optional: Enable dynamic rendering for high-traffic sites
// export const dynamic = 'force-dynamic'

// Generate metadata
export async function generateMetadata() {
  return {
    title: 'Home - IGIHE News',
    description: 'Latest news and updates',
  }
}

export default async function HomePage() {
  // Fetch all data on the server
  const initialData = await prefetchHomeData()
  
  return (
    <PrefetchHomeData initialData={initialData}>
      <Home />
    </PrefetchHomeData>
  )
}

// Optional: Add error boundary
export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="container mx-auto p-4">
      <h2>Something went wrong loading the homepage</h2>
      <p>{error.message}</p>
    </div>
  )
}