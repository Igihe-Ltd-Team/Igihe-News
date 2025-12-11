
// import { prefetchHomeData } from '@/lib/prefetch-home-data'
// import { PrefetchHomeData } from './prefetch-home-data'
// import { Home } from './home/home'

// // Enable ISR with revalidation every 5 minutes
// export const revalidate = 300

// // Optional: Enable dynamic rendering for high-traffic sites
// // export const dynamic = 'force-dynamic'

// // Generate metadata
// export async function generateMetadata() {
//   return {
//     title: 'Home - IGIHE News',
//     description: 'IGIHE news brings you the latest and breaking news, trending topics, and discussions from all over the world.',
//   }
// }

// export default async function HomePage() {
//   // Fetch all data on the server
//   const initialData = await prefetchHomeData()
  
//   return (
//     <PrefetchHomeData initialData={initialData}>
//       <Home />
//     </PrefetchHomeData>
//   )
// }

// // Optional: Add error boundary
// export function ErrorBoundary({ error }: { error: Error }) {
//   return (
//     <div className="container mx-auto p-4">
//       <h2>Something went wrong loading the homepage</h2>
//       <p>{error.message}</p>
//     </div>
//   )
// }





import { prefetchAllHomeData, prefetchHomeData } from '@/lib/prefetch-home-data'
import { Home } from './home/home'
import { PrefetchHomeData } from './prefetch-home-data'

// ============================================
// PERFORMANCE CONFIGURATION
// ============================================

// Enable ISR with 5-minute revalidation
export const revalidate = 300

// Optional: For high-traffic sites, consider shorter revalidation
// export const revalidate = 60 // 1 minute for breaking news sites

// Optional: Force dynamic rendering (no caching)
// export const dynamic = 'force-dynamic'

// Optional: Enable static generation
// export const dynamic = 'force-static'

// RECOMMENDED STRATEGY FOR NEWS SITES:
// Use ISR with 5-minute revalidation for best performance + freshness balance
const STRATEGY = 'full' // Options: 'fast' | 'full'

export async function generateMetadata() {
  return {
    title: 'Home - IGIHE News',
    description: 'IGIHE news brings you the latest and breaking news, trending topics, and discussions from all over the world.',
  }
}

export default async function HomePage() {
  // Choose your strategy based on needs
  const initialData = STRATEGY === 'full' 
    ? await prefetchAllHomeData()  // All data on server (best SEO)
    : await prefetchHomeData()     // Only critical data (fastest)

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
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Reload Page
      </button>
    </div>
  )
}