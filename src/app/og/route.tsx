// app/api/og/route.tsx
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

// export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const title = searchParams.get('title') || 'IGIHE News'
    const image = searchParams.get('image') || ''
    const category = searchParams.get('category') || 'Latest News'
    const date = searchParams.get('date') || new Date().toLocaleDateString()
    
    // Decode HTML entities
    const decodeHtml = (text: string) => {
      return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
    }
    
    const cleanTitle = decodeHtml(title).substring(0, 80)
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            backgroundColor: '#1a365d',
            backgroundImage: image 
              ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${image})`
              : 'linear-gradient(to bottom, #1a365d, #2d3748)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          {/* Logo */}
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: 40,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: '#e53e3e',
                padding: '8px 16px',
                borderRadius: 4,
              }}
            >
              IGIHE
            </div>
            <div
              style={{
                fontSize: 20,
                color: '#cbd5e0',
                marginLeft: 12,
              }}
            >
              Rwanda's Leading News
            </div>
          </div>
          
          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: 60,
              height: '100%',
              width: '100%',
            }}
          >
            {/* Category & Date */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  color: '#e53e3e',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {category}
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: '#cbd5e0',
                  marginLeft: 20,
                }}
              >
                {date}
              </div>
            </div>
            
            {/* Title */}
            <h1
              style={{
                fontSize: 60,
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                lineHeight: 1.1,
                marginBottom: 20,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {cleanTitle}
            </h1>
            
            {/* Website */}
            <div
              style={{
                fontSize: 24,
                color: '#a0aec0',
                marginTop: 'auto',
              }}
            >
              igihe.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
    
  } catch (error) {
    console.error('OG Image error:', error)
    
    // Return fallback image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a365d',
            color: 'white',
            fontSize: 48,
            fontWeight: 'bold',
          }}
        >
          IGIHE News
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }
}