'use client';

import { useEffect } from 'react';
import { ViewTracker } from '@/lib/viewTracker';

interface ViewTrackerProps {
  postId: number;
}

export function ViewTrackerComponent({ postId }: ViewTrackerProps) {
  useEffect(() => {
    // Track view after 3 seconds (to ensure it's not a bounce)
    const timer = setTimeout(() => {
      ViewTracker.trackView(postId);
    }, 3000);

    return () => clearTimeout(timer);
  }, [postId]);

  return null;
}