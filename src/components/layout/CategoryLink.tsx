
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CategoryLinkProps {
  slug: string;
  name: string;
  id: number;
}

export default function CategoryLink({ slug, name, id }: CategoryLinkProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  // Prefetch category page data on hover
  const handleMouseEnter = async () => {
    // Prefetch the page bundle
    router.prefetch(`/${slug}`);
    
    // Optionally preload the API data
    try {
      // Store in sessionStorage or custom cache
      const cacheKey = `category-${id}-data`;
      if (!sessionStorage.getItem(cacheKey)) {
        // Lightweight fetch for essential data
        await fetch(`/api/categories/${id}/preview`);
      }
    } catch (error) {
      // Silent fail - navigation will still work
      console.log('Prefetch failed, will load normally');
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isNavigating) {
      e.preventDefault();
      return;
    }
    
    setIsNavigating(true);
    
    // Optional: Add a loading indicator
    const indicator = document.createElement('div');
    indicator.className = 'navigation-loading';
    document.body.appendChild(indicator);
    
    // Remove indicator after navigation completes
    setTimeout(() => {
      document.body.removeChild(indicator);
    }, 1000);
  };

  return (
    <a
      href={`/${slug}`}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleMouseEnter} // Mobile support
      onClick={handleClick}
      className={`category-link ${isNavigating ? 'opacity-50' : ''}`}
    >
      {name}
      {isNavigating && <span className="ml-2">...</span>}
    </a>
  );
}