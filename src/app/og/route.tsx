// app/og/route.tsx - SIMPLE VERSION
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'IGIHE News'
    const image = searchParams.get('image') || ''
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            backgroundColor: '#fff',
            backgroundImage: image 
              ? `url(${image})`
              : 'linear-gradient(to bottom, #1a365d, #2d3748)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '40px',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '20px 30px',
              borderRadius: '10px',
              maxWidth: '900px',
            }}
          >
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: '24px',
                color: '#e2e8f0',
                marginTop: '10px',
              }}
            >
              IGIHE • Latest News from Rwanda
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch {
    return new ImageResponse(
      <div>IGIHE News</div>,
      {
        width: 1200,
        height: 630,
      }
    )
  }
}