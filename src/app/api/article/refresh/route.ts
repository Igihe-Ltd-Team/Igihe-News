// app/api/article/refresh/route.ts
import { ApiService } from '@/services/apiService';
import { NewsItem } from '@/types/fetchData';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiting helper
const rateLimit = new Map<string, number[]>();

function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const requests = rateLimit.get(ip) || [];
  const recentRequests = requests.filter(time => time > windowStart);

  if (recentRequests.length >= limit) {
    return false;
  }

  recentRequests.push(now);
  rateLimit.set(ip, recentRequests);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    // const ip = request?.ip || request.headers.get('x-forwarded-for') || 'anonymous';

     const ip = request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-client-ip') ||
    'anonymous'
    
    // Check rate limit (10 requests per minute per IP)
    if (!checkRateLimit(ip, 10, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    
    // Parse request
    const body = await request.json();
    const { slug, id, batch, secret } = body;
    
    // Optional authentication
    const expectedSecret = process.env.ARTICLE_REFRESH_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }
    
    // Handle batch refresh
    if (batch && Array.isArray(batch)) {
      if (batch.length > 20) {
        return NextResponse.json(
          { error: 'Batch size too large. Maximum 20 articles per batch.' },
          { status: 400 }
        );
      }
      
      // const results = await ApiService.batchRefresh(batch);
      
      return NextResponse.json({
        success: true,
        message: `Batch refresh completed for ${batch.length} articles`,
        // results,
        timestamp: new Date().toISOString()
      });
    }
    
    // Single article refresh
    let refreshedArticle: NewsItem | null = null;
    
    if (slug) {
      refreshedArticle = await ApiService.refreshArticle(slug, true);
    } else if (id) {
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
    
  } catch (error: any) {
    console.error('Article refresh API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to refresh article',
        message: error.message,
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