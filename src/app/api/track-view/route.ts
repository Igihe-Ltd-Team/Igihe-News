import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface ViewRecord {
  postId: number;
  visitorHash: string;
  userAgent: string;
  timestamp: string;
}

interface DailyViews {
  date: string;
  views: ViewRecord[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, visitorHash, userAgent, timestamp } = body;

    // Check if bot
    if (isBot(userAgent)) {
      return NextResponse.json({ success: false, message: 'Bot detected' });
    }

    // Validate data
    if (!postId || !visitorHash || !userAgent) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save to daily JSON file
    await saveDailyView({ postId, visitorHash, userAgent, timestamp });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function isBot(userAgent: string): boolean {
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

async function saveDailyView(view: ViewRecord) {
  const today = new Date().toISOString().split('T')[0];
  const dataDir = path.join(process.cwd(), 'data', 'views');
  const filePath = path.join(dataDir, `${today}.json`);

  try {
    // Ensure directory exists
    await fs.mkdir(dataDir, { recursive: true });

    let dailyViews: DailyViews = { date: today, views: [] };

    // Read existing file if it exists
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      dailyViews = JSON.parse(fileContent);
    } catch (error) {
      // File doesn't exist yet, use empty array
    }

    // Check if this visitor already viewed this post today
    const alreadyViewed = dailyViews.views.some(
      v => v.postId === view.postId && v.visitorHash === view.visitorHash
    );

    if (!alreadyViewed) {
      dailyViews.views.push(view);
      await fs.writeFile(filePath, JSON.stringify(dailyViews, null, 2));
    }
  } catch (error) {
    console.error('Error saving daily view:', error);
    throw error;
  }
}