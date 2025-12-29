// lib/cache/dynamicCache.ts

/**
 * Calculate cache TTL based on article age
 * - Articles older than 7 days: permanent cache (1 year)
 * - Articles less than 7 days old: 5-10 minutes cache
 */
export function calculateArticleCacheTTL(articleDate: string | Date): number {
  const now = Date.now();
  const articleTimestamp = new Date(articleDate).getTime();
  const ageInDays = (now - articleTimestamp) / (1000 * 60 * 60 * 24);
  
  const ONE_WEEK = 7;
  const FIVE_MINUTES = 5 * 60 * 1000;
  const TEN_MINUTES = 10 * 60 * 1000;
  const ONE_YEAR = 15 * 365 * 24 * 60 * 60 * 1000; // Essentially permanent
  
  if (ageInDays >= ONE_WEEK) {
    // Article is older than a week - cache permanently
    return ONE_YEAR;
  } else if (ageInDays >= 1) {
    // 1-7 days old - cache for 10 minutes
    return TEN_MINUTES;
  } else {
    // Less than 1 day old - cache for 5 minutes
    return FIVE_MINUTES;
  }
}

/**
 * Calculate cache TTL for article lists based on newest article
 */
export function calculateListCacheTTL(articles: Array<{ date: string | Date }>): number {
  if (!articles || articles.length === 0) {
    return 5 * 60 * 1000; // Default 5 minutes
  }
  
  // Find the newest article
  const newestArticle = articles.reduce((newest, current) => {
    const currentDate = new Date(current.date).getTime();
    const newestDate = new Date(newest.date).getTime();
    return currentDate > newestDate ? current : newest;
  });
  
  // Use the newest article's date to determine cache TTL
  return calculateArticleCacheTTL(newestArticle.date);
}

/**
 * Check if cached data should be revalidated based on article age
 */
export function shouldRevalidateCache(
  cachedTimestamp: number,
  articleDate: string | Date,
  ttl: number
): boolean {
  const now = Date.now();
  const cacheAge = now - cachedTimestamp;
  
  // If cache hasn't expired yet, don't revalidate
  if (cacheAge < ttl) {
    return false;
  }
  
  // Check if article is still within the "fresh" period
  const articleAge = (now - new Date(articleDate).getTime()) / (1000 * 60 * 60 * 24);
  
  // If article is now older than a week, we can cache permanently
  if (articleAge >= 7) {
    return false; // Don't revalidate, it's now permanent
  }
  
  return true; // Revalidate for fresh articles
}