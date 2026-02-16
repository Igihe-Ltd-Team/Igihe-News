import { getLiveEvents, getTopSliderArticles } from '@/components/home/actions'
import Slides from '@/components/home/Slides'
import NewsSkeleton from '@/components/NewsSkeleton'
import TimeLine from '@/components/ReUsable/TimeLine'
import { useTopSliderArticles } from '@/hooks/useMainNewsData'
import { useNewsData } from '@/hooks/useNewsData'
import React, { Suspense } from 'react'

async function TopSection() {

const [
        topSlider,
        liveEvent
      ] = await Promise.all([
        getTopSliderArticles(),
        getLiveEvents(),
      ])

      
  return (
    <Suspense fallback={<NewsSkeleton count={3} />}>
          {
            liveEvent?.length > 0 ?
              // <Slides articles={topSlider} lgDisplay={3} mdDisplay={2} smDisplay={1} showControll />
              <TimeLine articles={liveEvent} />
              :
              topSlider?.length > 0 &&
              <Slides articles={topSlider} lgDisplay={3} mdDisplay={2} smDisplay={1} showControll />
          }
        </Suspense>
  )
}

export default TopSection