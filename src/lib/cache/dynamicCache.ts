// export function calculateArticleCacheTTL(articleDate: string | Date): number {
//   const now = Date.now();
//   const articleTimestamp = new Date(articleDate).getTime();
//   const ageInMinutes = (now - articleTimestamp) / (1000 * 60);
//   const ageInHours = ageInMinutes / 60;
//   const ageInDays = ageInHours / 24;

//   // Very recent articles (< 1 hour): 2 minutes cache
//   if (ageInMinutes < 60) {
//     return 2 * 60 * 1000;
//   }
//   // Recent articles (< 6 hours): 5 minutes cache
//   else if (ageInHours < 6) {
//     return 5 * 60 * 1000;
//   }
//   // Today's articles (< 24 hours): 10 minutes cache
//   else if (ageInDays < 1) {
//     return 10 * 60 * 1000;
//   }
//   // This week's articles (< 7 days): 30 minutes cache
//   else if (ageInDays < 7) {
//     return 30 * 60 * 1000;
//   }
//   // Older articles: permanent cache (1 year)
//   else {
//     return 365 * 24 * 60 * 60 * 1000;
//   }
// }



// /**
//  * Calculate cache TTL for article lists based on newest article
//  */
// export function calculateListCacheTTL(articles: Array<{ date: string | Date }>): number {
//   if (!articles || articles.length === 0) {
//     return 5 * 60 * 1000; // Default 5 minutes
//   }
  
//   // Find the newest article
//   const newestArticle = articles.reduce((newest, current) => {
//     const currentDate = new Date(current.date).getTime();
//     const newestDate = new Date(newest.date).getTime();
//     return currentDate > newestDate ? current : newest;
//   });
  
//   // Use the newest article's date to determine cache TTL
//   return calculateArticleCacheTTL(newestArticle.date);
// }

// /**
//  * Check if cached data should be revalidated based on article age
//  */
// export function shouldRevalidateCache(
//   cachedTimestamp: number,
//   articleDate: string | Date,
//   ttl: number
// ): boolean {
//   const now = Date.now();
//   const cacheAge = now - cachedTimestamp;
  
//   // If cache hasn't expired yet, don't revalidate
//   if (cacheAge < ttl) {
//     return false;
//   }
  
//   // Check if article is still within the "fresh" period
//   const articleAge = (now - new Date(articleDate).getTime()) / (1000 * 60 * 60 * 24);
  
//   // If article is now older than a week, we can cache permanently
//   if (articleAge >= 7) {
//     return false; // Don't revalidate, it's now permanent
//   }
  
//   return true; // Revalidate for fresh articles
// }




/**
 * Calculate cache TTL for article lists
 * FRESH period: data is considered fresh, return immediately
 * MAX STALE period: 10x FRESH, data is acceptable but triggers background refresh
 */
export function calculateListCacheTTL(isFirstPage: boolean = false): number {
  // Homepage/Category landing pages
  if (isFirstPage) {
    return 2 * 60 * 1000;  // 2 minutes fresh, 20 minutes max stale
  }
  
  // Pagination pages
  return 5 * 60 * 1000;  // 5 minutes fresh, 50 minutes max stale
}

/**
 * Calculate cache TTL for individual articles
 */
export function calculateArticleCacheTTL(articleDate: string | Date): number {
  const now = Date.now();
  const articleTimestamp = new Date(articleDate).getTime();
  const ageInMinutes = (now - articleTimestamp) / (1000 * 60);
  const ageInHours = ageInMinutes / 60;
  const ageInDays = ageInHours / 24;

  // Very recent articles (< 1 hour): 2 minutes fresh
  if (ageInMinutes < 60) {
    return 2 * 60 * 1000;
  }
  // Recent articles (< 6 hours): 5 minutes fresh
  else if (ageInHours < 6) {
    return 5 * 60 * 1000;
  }
  // Today's articles (< 24 hours): 10 minutes fresh
  else if (ageInDays < 1) {
    return 10 * 60 * 1000;
  }
  // This week's articles (< 7 days): 30 minutes fresh
  else if (ageInDays < 7) {
    return 30 * 60 * 1000;
  }
  // Older articles: 1 day fresh (effectively permanent with 10x stale = 10 days)
  else {
    return 24 * 60 * 60 * 1000;
  }
}