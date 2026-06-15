// app/api/article/refresh/route.ts
import { ApiService } from '@/services/apiService';
import { LocalRateLimiter } from '@/lib/rateLimit';
import { NewsItem } from '@/types/fetchData';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiting helper
const refreshRateLimiter = new LocalRateLimiter({ limit: 10, windowMs: 60_000 });

export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.ARTICLE_REFRESH_SECRET;
    const incomingSecret = request.headers.get('x-article-refresh-secret');
    if (!expectedSecret || incomingSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client IP for rate limiting
    // const ip = request?.ip || request.headers.get('x-forwarded-for') || 'anonymous';

     const ip = request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-client-ip') ||
    'anonymous'
    
    // Check rate limit (10 requests per minute per IP)
    const rateLimit = refreshRateLimiter.check(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }
    
    // Parse request
    const body = await request.json();
    const { slug, id } = body;
    
    // Single article refresh
    let refreshedArticle: NewsItem | null = null;
    
    if (typeof slug === 'string' && slug.length <= 200) {
      refreshedArticle = await ApiService.refreshArticle(slug, true);
    } else if (Number.isInteger(id) && id > 0) {
      refreshedArticle = await ApiService.refreshArticleById(id, true);
    } else {
      return NextResponse.json(
        { error: 'Either slug or id is required' },
        { status: 400 }
      );
    }
    
    if (!refreshedArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Article refreshed successfully',
      article: {
        id: refreshedArticle.id,
        slug: refreshedArticle.slug,
        title: refreshedArticle.title.rendered,
        date: refreshedArticle.date,
        cacheTime: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Article refresh API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to refresh article',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}




// GET endpoint for cache status
// export async function GET(request: NextRequest) {
//   const searchParams = request.nextUrl.searchParams;
//   const slug = searchParams.get('slug');
//   const id = searchParams.get('id');
  
//   if (!slug && !id) {
//     return NextResponse.json(
//       { error: 'Either slug or id parameter is required' },
//       { status: 400 }
//     );
//   }
  
//   try {
//     // Find article in caches
//     let cacheInfo;
    
//     if (slug) {
//       cacheInfo = await getArticleCacheInfo(slug);
//     } else if (id) {
//       // Get slug from API first
//       const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/posts/${id}?_fields=slug`);
//       if (response.ok) {
//         const post = await response.json();
//         cacheInfo = await getArticleCacheInfo(post.slug);
//       }
//     }
    
//     return NextResponse.json({
//       ...cacheInfo,
//       timestamp: new Date().toISOString()
//     });
    
//   } catch (error: any) {
//     return NextResponse.json(
//       { error: error.message },
//       { status: 500 }
//     );
//   }
// }

// async function getArticleCacheInfo(slug: string) {
//   const cacheKey = `post:${slug}`;
//   const now = Date.now();
  
//   // Memory cache info
//   const memoryCached = requestCache.get(cacheKey);
//   const memoryInfo = memoryCached ? {
//     exists: true,
//     age: Math.round((now - memoryCached.timestamp) / 1000),
//     data: {
//       id: memoryCached.data.id,
//       title: memoryCached.data.title.rendered,
//       date: memoryCached.data.date
//     }
//   } : { exists: false };
  
//   // File cache info
//   let fileInfo = { exists: false };
//   if (typeof window === 'undefined') {
//     try {
//       const fileCached = await fileCache.get<any>(cacheKey);
//       fileInfo = fileCached ? { 
//         exists: true,
//         data: {
//           id: fileCached.id,
//           title: fileCached.title?.rendered,
//           date: fileCached.date
//         }
//       } : { exists: false };
//     } catch (error) {
//       fileInfo = { exists: false, error: 'Failed to check' };
//     }
//   }
  
//   return {
//     slug,
//     cacheKey,
//     memoryCache: memoryInfo,
//     fileCache: fileInfo,
//     inPendingRequests: pendingRequests.has(cacheKey)
//   };
// }
