'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { LightboxImage, RawImageObject, LightboxProps, UseLightboxReturn } from './Lightbox.types';
import { normalizeRawImage } from './Lightbox.types';

/**
 * Generic hook — accepts any array whose items extend RawImageObject (or are strings).
 * This means ImageData[], YourCustomType[], plain string[], etc. all work without casting.
 *
 * @example
 * const { containerRef, lightboxProps } = usePostContentLightbox(imgs); // ImageData[] ✓
 */
export function usePostContentLightbox<T extends RawImageObject | string>(
  imagesProp?: T[]
): UseLightboxReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [lightboxState, setLightboxState] = useState<{
    images: LightboxImage[];
    index: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handler = (e: MouseEvent) => {
      const img = (e.target as HTMLElement).closest('img') as HTMLImageElement | null;
      if (!img || !container.contains(img)) return;
      e.preventDefault();

      const images: LightboxImage[] =
        imagesProp && imagesProp.length > 0
          ? imagesProp.map(normalizeRawImage)
          : Array.from(container.querySelectorAll('img')).map((el) => ({
              src: (el as HTMLImageElement).src,
              alt: (el as HTMLImageElement).alt ?? '',
            }));

      const allImgs = Array.from(container.querySelectorAll('img'));
      const clickedIdx = Math.max(0, allImgs.indexOf(img));

      setLightboxState({ images, index: clickedIdx });
    };

    container.addEventListener('click', handler);
    return () => container.removeEventListener('click', handler);
  }, [imagesProp]);

  // Add zoom-in cursor to all images in the content
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll('img').forEach((el) => {
      (el as HTMLImageElement).style.cursor = 'zoom-in';
    });
  });

  const close = useCallback(() => setLightboxState(null), []);

  const lightboxProps: LightboxProps = lightboxState
    ? { isOpen: true, images: lightboxState.images, startIndex: lightboxState.index, onClose: close }
    : { isOpen: false, images: [], startIndex: 0, onClose: close };

  return { containerRef, lightboxProps };
}