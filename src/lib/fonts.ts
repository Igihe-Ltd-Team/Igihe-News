import { Raleway } from 'next/font/google';
import localFont from 'next/font/local';

export const raleway = Raleway({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-raleway',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

// /Users/ishimweamir/Downloads/projects/igihe/igihe-news/public/assets/fonts/visby/VisbyRoundCF-Heavy.woff2

export const visby = localFont({
  src: [
    {
      path: '../../public/assets/fonts/visby/VisbyRoundCF-ExtraLight.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../../public/assets/fonts/visby/VisbyRoundCF-Light.woff2',
      weight: '300',
      style: 'normal'
    },
    {
      path: '../../public/assets/fonts/visby/VisbyRoundCF-Regular.woff2',
      weight: '400',
      style: 'normal'
    },
    {
      path: '../../public/assets/fonts/visby/VisbyRoundCF-Medium.woff2',
      weight: '500',
      style: 'normal'
    },
    {
      path: '../../public/assets/fonts/visby/VisbyRoundCF-DemiBold.woff2',
      weight: '600',
      style: 'normal'
    },
    {
      path: '../../public/assets/fonts/visby/VisbyRoundCF-Bold.woff2',
      weight: '700',
      style: 'normal'
    },
    {
      path: '../../public/assets/fonts/visby/VisbyRoundCF-ExtraBold.woff2',
      weight: '800',
      style: 'normal'
    },
    {
      path: '../../public/assets/fonts/visby/VisbyRoundCF-Heavy.woff2',
      weight: '900',
      style: 'normal'
    }
  ],
  variable: '--font-visby',
  display: 'swap',
});