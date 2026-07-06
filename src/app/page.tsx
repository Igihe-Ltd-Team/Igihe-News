import { Home } from './home/home'


export const revalidate = 300
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    title: 'Home - IGIHE News',
    description: 'IGIHE news brings you the latest and breaking news, trending topics, and discussions from all over the world.',
  }
}

export default function HomePage() {
  return <Home />
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
