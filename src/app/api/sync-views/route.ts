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
    // Verify authorization (for manual triggers)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader !== `Bearer ${process.env.SYNC_SECRET_KEY}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const dataDir = path.join(process.cwd(), 'data', 'views');
    const filePath = path.join(dataDir, `${dateStr}.json`);

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const dailyViews: DailyViews = JSON.parse(fileContent);

      // Send to WordPress using REST API with Application Password
      const wpUrl = process.env.WORDPRESS_URL;
      const username = process.env.WORDPRESS_USERNAME;
      const appPassword = process.env.WORDPRESS_APP_PASSWORD;

      if (!wpUrl || !username || !appPassword) {
        throw new Error('Missing WordPress configuration');
      }

      const results = await syncToWordPressREST(
        dailyViews.views,
        wpUrl,
        username,
        appPassword
      );

      // Archive the file after successful sync
      if (results.success > 0 || results.failed === 0) {
        const archiveDir = path.join(dataDir, 'archive');
        await fs.mkdir(archiveDir, { recursive: true });
        await fs.rename(
          filePath,
          path.join(archiveDir, `${dateStr}.json`)
        );
      }

      return NextResponse.json({
        success: true,
        synced: results.success,
        failed: results.failed,
        skipped: results.skipped,
        date: dateStr,
        message: `Synced ${results.success} views, ${results.failed} failed, ${results.skipped} skipped`,
      });
    } catch (error) {
      console.error('Error reading views file:', error);
      return NextResponse.json({
        success: false,
        message: `No views file found for ${dateStr}`,
      });
    }
  } catch (error) {
    console.error('Error syncing views:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Sync views to WordPress using REST API with Application Password
 */
async function syncToWordPressREST(
  views: ViewRecord[],
  wpUrl: string,
  username: string,
  appPassword: string
) {
  // Remove spaces from application password
  const cleanPassword = appPassword.replace(/\s+/g, '');
  
  // Create Basic Auth header
  const auth = Buffer.from(`${username}:${cleanPassword}`).toString('base64');

  try {
    // Send batch request to WordPress REST API
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/pvt/v1/sync-views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        views: views,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WordPress API Error:', response.status, errorText);
      throw new Error(`WordPress API returned ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: result.synced || 0,
      failed: result.failed || 0,
      skipped: result.skipped || 0,
    };
  } catch (error) {
    console.error('Failed to sync to WordPress:', error);
    return { 
      success: 0, 
      failed: views.length,
      skipped: 0,
    };
  }
}

// GET endpoint to check sync status
export async function GET() {
  const dataDir = path.join(process.cwd(), 'data', 'views');
  
  try {
    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const pendingViews = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(dataDir, file), 'utf-8');
        const data = JSON.parse(content);
        return {
          date: data.date,
          viewCount: data.views.length,
          file: file,
        };
      })
    );

    return NextResponse.json({
      pendingFiles: pendingViews.length,
      pendingViews: pendingViews,
      totalViews: pendingViews.reduce((sum, f) => sum + f.viewCount, 0),
    });
  } catch (error) {
    return NextResponse.json({
      pendingFiles: 0,
      pendingViews: [],
      totalViews: 0,
    });
  }
}