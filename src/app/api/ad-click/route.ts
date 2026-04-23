import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const adId = searchParams.get('adId') || 'unknown'
  const position = searchParams.get('position') || 'unknown'

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  // Validate it's a real URL to prevent open redirect abuse
  let decodedUrl: string
  try {
    decodedUrl = decodeURIComponent(url)
    new URL(decodedUrl) // throws if invalid
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  // Return an HTML page that fires GA event then redirects
  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Redirecting...</title>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-60209Y4RNZ"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){ dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', 'G-60209Y4RNZ');

      // Fire ad_click event, then redirect
      gtag('event', 'ad_click', {
        event_category: 'Advertisement',
        event_label: '${adId}',
        ad_position: '${position}',
        ad_destination: '${decodedUrl}',
        send_to: 'G-60209Y4RNZ'
      });

      // Small delay to let GA send the event before navigating
      setTimeout(function () {
        window.location.replace('${decodedUrl}');
      }, 300);
    </script>
  </head>
  <body>
    <p style="font-family:sans-serif;text-align:center;margin-top:20vh;color:#555;">
      
    </p>
  </body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}