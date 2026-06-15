import { NextRequest, NextResponse } from 'next/server';
import { LocalRateLimiter } from '@/lib/rateLimit';

const BACKEND_URL = 'https://igihecomments.com';
const commentRateLimiter = new LocalRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('cf-connecting-ip') ||
    'anonymous';
}

function isValidText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const identifier = searchParams.get('identifier');
    if (!identifier || identifier.length > 100) {
      return NextResponse.json({ error: 'Valid identifier is required' }, { status: 400 });
    }

    const params = new URLSearchParams({ identifier });
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
      console.error(`Comments backend returned ${response.status}`);
      
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
    console.error('Comments proxy GET error:', error);
    
    return NextResponse.json(
      {
        nodes: [
          {
            node: {
              Status: 'Failed',
              message: 'Unable to fetch comments',
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
    const rateLimit = commentRateLimiter.check(getClientIp(request));
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many comments. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    if (
      !isValidText(body.name, 100) ||
      !isValidText(body.email, 254) ||
      !isValidText(body.comment, 5_000) ||
      !isValidText(body.identifier, 100) ||
      (body.reference !== undefined && typeof body.reference !== 'string') ||
      (body.url !== undefined && typeof body.url !== 'string') ||
      (body.reply_to !== undefined && typeof body.reply_to !== 'string')
    ) {
      return NextResponse.json({ error: 'Invalid comment submission' }, { status: 400 });
    }

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

    if (!response.ok) {
      return NextResponse.json({ error: 'Comment service unavailable' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Comments proxy POST error:', error);
    return NextResponse.json({ error: 'Unable to submit comment' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
