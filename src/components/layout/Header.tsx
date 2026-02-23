import { Col, Row } from 'react-bootstrap'
import Image from 'next/image'
import HeaderClient from './HeaderClient'
import { ApiService } from '@/services/apiService'
// import AdManager from '../ads/AdManager'
import ServerSlotManager from '../ads/ServerSlotManager'
import HeaderClientx from './HeaderClientx'
import DeskHeader from './DeskHeader'

// Fetch categories on the server
async function getCategories() {
  try {
    // Replace with your actual API endpoint
    const res = await ApiService.fetchCategories()


    return res
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

const menus = [
  { name: "Politics" },
  { name: "Health" },
  { name: "Sports" },
  { name: "Entertainment" },
  { name: "Technology" },
  { name: "Arts &amp; Culture" },
  { name: "Economy" },
  { name: "People" },
  { name: "Tourism" },
  { name: "Environment" },
  { name: "Religion" },
  { name: "News" },
]

export default async function Header() {
  const categories = await getCategories()

  // Normalize and order categories
  const normalizedCategories = categories.map((cat: any) => ({
    ...cat,
    name: cat.name?.trim().toLowerCase(),
  }))

  const normalizedMenus = menus.map((m) => m.name.toLowerCase())

  const orderedCategories = normalizedMenus
    .map((menuName) =>
      normalizedCategories.find((cat: any) => cat.name === menuName)
    )
    .filter(Boolean)

  return (
    <DeskHeader categories={categories}>
      <div className='site-header'>
      <div className="overlay"></div>
      <div className="overlay-sky"></div>
      <div className="overlay-sky-right"></div>

      <div className="container z-1 position-relative hero-bg">
        {/* Desktop Ads - Server Side */}
        <div className="d-none d-md-block">
          <Row>
            <Col>
              <ServerSlotManager
                position="premium_leaderboard_1"
                priority={true}
              />
            </Col>
            <Col>
              <ServerSlotManager
                position="mot-premium_leaderboard_1_b"
                priority={true}
              />
            </Col>
          </Row>
        </div>

        {/* Client-side interactive header */}
        <HeaderClient
          categories={orderedCategories}
          logoSection={
            <a href="/">
              <span className='site-logo'>
                <Image
                  width={240}
                  src={'/assets/newlogo.png'}
                  height={100}
                  className='object-fit-contain'
                  alt={'IGEHE Logo'}
                />
              </span>
            </a>
          }
          desktopAdSection={
            <Col md={7} key={Math.random()}>
              <ServerSlotManager
                position="ad1_leaderboard_728x90"
                priority={true}
                imgClass="object-position-right"
              />
            </Col>
          }
        />
      </div>

      <HeaderClientx
        categories={orderedCategories}
        logoSection={
          <a href="/">
            <span className='site-logo'>
              <Image
                width={240}
                src={'/assets/newlogo.png'}
                height={100}
                className='object-fit-contain'
                alt={'IGEHE Logo'}
              />
            </span>
          </a>
        }
        desktopAdSection={
          <Col md={7}>
            <ServerSlotManager
              position="ad1_leaderboard_728x90"
              priority={true}
              imgClass="object-position-right"
            />
          </Col>
        }
      />
    </div>
    </DeskHeader>
  )
}