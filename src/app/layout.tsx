import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import { Providers } from './providers';
import { raleway } from '@/lib/fonts';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'IGIHE',
  description: 'Latest breaking news',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={raleway.variable}>
        <Providers>
          <Header />
          <main className="py-4">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}