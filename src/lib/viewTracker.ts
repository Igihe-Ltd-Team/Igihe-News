import { v4 as uuidv4 } from 'uuid';

interface ViewData {
  postId: number;
  visitorHash: string;
  userAgent: string;
  timestamp: string;
}

export class ViewTracker {
  private static STORAGE_KEY = 'visitor_hash';
  private static API_ENDPOINT = '/api/track-view';

  /**
   * Generate or retrieve visitor hash
   */
  static getVisitorHash(): string {
    if (typeof window === 'undefined') return '';

    let hash = localStorage.getItem(this.STORAGE_KEY);
    if (!hash) {
      // Generate hash from browser fingerprint
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        screen.width,
        screen.height,
        new Date().getTimezoneOffset(),
      ].join('|');

      // Simple hash function
      hash = this.simpleHash(fingerprint);
      localStorage.setItem(this.STORAGE_KEY, hash);
    }
    return hash;
  }

  /**
   * Simple hash function
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Track a post view
   */
  static async trackView(postId: number): Promise<void> {
    if (typeof window === 'undefined') return;

    const visitorHash = this.getVisitorHash();
    const userAgent = navigator.userAgent;

    try {
      await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          visitorHash,
          userAgent,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  }

  /**
   * Check if user is a bot
   */
  static isBot(userAgent: string): boolean {
    const botPatterns = [
      'bot', 'crawl', 'spider', 'slurp',
      'mediapartners-google', 'googlebot', 'bingbot',
      'yandex', 'duckduckgo', 'baiduspider',
      'facebookexternalhit', 'twitterbot', 'whatsapp',
      'linkedinbot', 'pinterestbot'
    ];

    return botPatterns.some(pattern => 
      userAgent.toLowerCase().includes(pattern)
    );
  }
}
