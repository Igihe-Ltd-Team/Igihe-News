import Categories from '@/components/home/Categories'
import HomeMainSections from '@/components/home/HomeMainSections'
import Recents from '@/components/home/Recents'
import Slides from '@/components/home/Slides'
import NewsSkeleton from '@/components/NewsSkeleton'
import TimeLine from '@/components/ReUsable/TimeLine'
import { useNewsData } from '@/hooks/useNewsData'
import React, { Suspense } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { useFeaturedArticles, useTopSliderArticles } from '@/hooks/useMainNewsData'
import CustomSlider from '@/components/home/CustomSlider'
import AdManager from '@/components/ads/AdManager'
import TopSection from './TopSection'
import ServerSlotManager from '@/components/ads/ServerSlotManager'


const upperCats = [
  {
    id: 8,
    name: 'Business',
    slug: 'business'
  },
  {
    id: 9,
    name: 'Science',
    slug: 'science-technology'
  },
  {
    id: 10,
    name: 'Health',
    slug: 'health'
  },
  {
    id: 15,
    name: 'Tourism',
    slug: 'tourism'
  }]

const lowerCats = [
  {
    id: 11,
    name: 'Sports',
    slug: 'sports'
  },
  {
    id: 12,
    name: 'Arts & Culture',
    slug: 'arts-culture'
  },
  {
    id: 14,
    name: 'Environment',
    slug: 'environment'
  },
  {
    id: 19,
    name: 'Diaspora',
    slug: 'diaspora'
  }]


export function Home() {
  

  return (
    <>
      <Container>
        <TopSection/>
      </Container>

      <Suspense fallback={<NewsSkeleton count={3} />}>
        <HomeMainSections />
      </Suspense>


      <Suspense fallback={null}>
        <Container>
          <CustomSlider
            lgDisplay={2}
            mdDisplay={2}
            smDisplay={1}
          >
            <Suspense fallback={null}>
            <ServerSlotManager
              position="home-bellow-hights"
              priority={true}
            />
            </Suspense>
            <Suspense fallback={null}>
            <ServerSlotManager
              position="home-bellow-hights-2"
              priority={true}
            />
            </Suspense>
          </CustomSlider>
        </Container>
      </Suspense>

      <Suspense fallback={<NewsSkeleton count={3} />}>
        <Recents />
      </Suspense>
      <Suspense fallback={null}>
        <Container>
          <CustomSlider
            lgDisplay={2}
            mdDisplay={2}
            smDisplay={1}
          >
            <Suspense fallback={null}>
            <ServerSlotManager
              position="premium_leaderboard_1"
              priority={true}
              className="mb-2"
            />
            </Suspense>
            <Suspense fallback={null}>
            <ServerSlotManager
              position="header-landscape-ad-2"
              priority={true}
              className="mb-2"
            />
            </Suspense>
          </CustomSlider>
        </Container>
      </Suspense>
      <Suspense fallback={<NewsSkeleton count={1} />}>
        <Categories categories={upperCats} />
      </Suspense>
      <Suspense fallback={null}>
        <Container>
          <CustomSlider
            lgDisplay={2}
            mdDisplay={2}
            smDisplay={1}
          ><Suspense fallback={null}>
            <ServerSlotManager
              position="premium_leaderboard_1"
              priority={true}
              className="mb-2"
            />
            </Suspense>
            <Suspense fallback={null}>
            <ServerSlotManager
              position="header-landscape-ad-2"
              priority={true}
              className="mb-2"
            />
            </Suspense>
          </CustomSlider>
        </Container>
      </Suspense>
      <Suspense fallback={<NewsSkeleton count={1} />}>
        <Categories categories={lowerCats} />
      </Suspense>
    </>
  )
}



function AdPlaceholder() {
  return (
    <div className="slot-position">
      <div className="animate-pulse bg-gray-200 h-32 w-full rounded"></div>
    </div>
  )
}