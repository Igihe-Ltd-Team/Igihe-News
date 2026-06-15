import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import { Providers } from './providers';
import { raleway } from '@/lib/fonts';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { initCacheCleanup } from '@/lib/cache/cleanup'
import Script from 'next/script';
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { Suspense } from 'react';
import { resetRegistry } from '@/lib/postRegistry';

export const metadata = {
  title: 'IGIHE',
  description: 'Latest breaking news',
};

if (typeof window === 'undefined') {
  initCacheCleanup()
  // resetRegistry()
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
//   if (typeof window !== 'undefined') {
//   ApiService.initialize();
// }


  return (
    <html lang="en" suppressHydrationWarning>
      <body className={raleway.variable} suppressHydrationWarning>

        <Suspense fallback={null}>
          {/* Suspense is required because useSearchParams() suspends */}
          <GoogleAnalytics />
        </Suspense>
        
        <Providers>
          <Header />
          <main className="py-2">{children}</main>
          <Footer/>
        </Providers>
        <Script
          src="https://traffic.igihe.com/t.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
