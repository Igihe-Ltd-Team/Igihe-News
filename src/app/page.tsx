import { Home } from './home/home'


export const revalidate = 300
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    metadataBase: new URL('https://en.igihe.com'),
    title: {
      default: 'IGIHE News',
      template: '%s | IGIHE',
    },
    applicationName: 'IGIHE English',
    keywords: [
      'IGIHE',
      'IGIHE English',
      'English IGIHE',
      'IGIHE News',
      'Rwanda news',
      'Africa news',
      'East Africa news',
      'Rwanda latest news',
      'breaking news Rwanda',
      'Rwanda politics',
      'Rwanda business',
      'Rwanda sports',
      'Rwanda entertainment',
      'Rwanda',
      'Kigali',
      'Africa',
      'East Africa',
    ],
    description: 'IGIHE news brings you the latest and breaking news, trending topics, and discussions from all over the world.',

    authors: [
      {
        name: 'IGIHE',
        url: 'https://en.igihe.com',
      },
    ],
    creator: 'IGIHE',
    publisher: 'IGIHE',
    alternates: {
      canonical: '/',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },

    openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://en.igihe.com',
    siteName: 'IGIHE',
    title: 'IGIHE News',
    description:
      'Latest news, breaking news, trending stories, and important updates from Rwanda and around the world.',
    images: [
      {
        url: '/assets/igiheIcon.png',
        width: 1200,
        height: 630,
        alt: 'IGIHE News',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'IGIHE News',
    description:
      'Latest news, breaking news, trending stories, and important updates from Rwanda and around the world.',
    images: ['/assets/igiheIcon.png'],
  },

  category: 'news',



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
