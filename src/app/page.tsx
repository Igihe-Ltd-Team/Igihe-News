import { Home } from './home/home'


export const revalidate = 300

export async function generateMetadata() {
  return {
    metadataBase: new URL('https://en.igihe.com'),
    title: {
      default: 'IGIHE News',
      template: '%s | IGIHE',
    },
    applicationName: 'IGIHE English',


    keywords: [
      // Brand
      'IGIHE',
      'IGIHE English',
      'IGIHE News',
      'English News Rwanda',

      // Rwanda News
      'Rwanda news',
      'Rwanda latest news',
      'Rwanda breaking news',
      'news in Rwanda',
      'Rwanda current affairs',
      'Rwanda today',
      'Kigali news',

      // Politics & Government
      'Rwanda politics',
      'Rwanda government',
      'Rwanda president',
      'Rwanda parliament',
      'Rwanda public affairs',
      'Rwanda political news',

      // Business & Economy
      'Rwanda business',
      'Rwanda business news',
      'Rwanda economy',
      'Rwanda economic news',
      'Rwanda investment',
      'Rwanda finance',
      'Kigali business',

      // Africa & East Africa
      'Africa news',
      'African news',
      'East Africa news',
      'East African news',
      'Africa breaking news',
      'African politics',
      'African business',

      // Sports
      'Rwanda sports',
      'Rwanda sports news',
      'Rwanda football',
      'Rwanda football news',
      'African football',
      'East Africa sports',

      // Technology
      'Rwanda technology',
      'Rwanda tech news',
      'Africa technology',
      'African technology news',
      'digital Rwanda',
      'technology news',

      // Entertainment & Culture
      'Rwanda entertainment',
      'Rwanda entertainment news',
      'Rwanda culture',
      'Rwandan culture',
      'Kigali entertainment',
      'African entertainment',

      // International
      'international news',
      'world news',
      'global news',
      'latest international news',
      'breaking world news'
    ],

    description:
      'IGIHE English brings you the latest news from Rwanda, Africa and around the world, covering politics, business, sports, technology, entertainment, culture and current affairs.',
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
