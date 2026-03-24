import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://igihecomments.com';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Build query string
    const params = new URLSearchParams();
    
    // For fetch requests
    if (searchParams.has('identifier')) {
      params.append('identifier', searchParams.get('identifier') || '');
    }
    
    // For submit requests
    if (searchParams.has('name')) {
      params.append('name', searchParams.get('name') || '');
      params.append('email', searchParams.get('email') || '');
      params.append('comment', searchParams.get('comment') || '');
      params.append('identifier', searchParams.get('identifier') || '');
      params.append('title', searchParams.get('title') || '');
      params.append('url', searchParams.get('url') || '');
      params.append('reply_to', searchParams.get('reply_to') || '');
    }

    const backendUrl = `${BACKEND_URL}/api/routes?${params.toString()}`;
    
    // console.log('📤 GET request to backend:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Backend returned ${response.status}:`, text);
      
      return NextResponse.json(
        {
          nodes: [
            {
              node: {
                Status: 'Failed',
                message: `Backend error: ${response.status}`,
              },
            },
          ],
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    // console.log('✅ Response:', JSON.stringify(data));

    return NextResponse.json(data);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Proxy GET error:', errorMessage);
    
    return NextResponse.json(
      {
        nodes: [
          {
            node: {
              Status: 'Failed',
              message: `Proxy error: ${errorMessage}`,
            },
          },
        ],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); // JSON from frontend

    // Build form data
    const formData = new URLSearchParams();
    formData.append('name', body.name || '');
    formData.append('email', body.email || '');
    formData.append('comment', body.comment || '');
    formData.append('identifier', body.identifier || '');
    formData.append('title', body.reference || '');
    formData.append('url', body.url || '');
    formData.append('reply_to', body.reply_to || '');

    // Send to backend WITHOUT query string
    const response = await fetch(`${BACKEND_URL}/api/routes/index.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}