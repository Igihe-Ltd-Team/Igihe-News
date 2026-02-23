import type { RefObject, CSSProperties } from 'react';

/** Internal normalized image shape used by the lightbox UI */
export interface LightboxImage {
  src: string;
  alt?: string;
  caption?:string
}

/**
 * Any object that has at least one of: url, src — plus optional alt/caption.
 * Using a loose interface instead of an index signature so concrete types are assignable.
 */
export interface RawImageObject {
  url?: string;
  src?: string;
  alt?: string;
  caption?: string;
}

/** Union of all accepted raw image shapes */
export type RawImageItem = string | RawImageObject;

/** Normalize any raw image shape into the internal LightboxImage format */
export function normalizeRawImage(item: RawImageItem): LightboxImage {
  if (typeof item === 'string') return { src: item, alt: '' };
  return {
    src: item.url ?? item.src ?? '',
    alt: item.alt ?? item.caption ?? '',
    caption: item.caption ?? '',
  };
}

export interface LightboxProps {
  isOpen: boolean;
  images: LightboxImage[];
  startIndex: number;
  onClose: () => void;
}

export interface LightboxImageProps {
  image: LightboxImage;
}

export interface LightboxControlsProps {
  direction: 'prev' | 'next';
  onClick: () => void;
}

export interface ThumbnailStripProps {
  images: LightboxImage[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export interface PostContentProps {
  html: string;
  images?: RawImageItem[];
  className?: string;
  style?: CSSProperties;
}

export interface UseLightboxReturn {
  containerRef: RefObject<HTMLDivElement | null>;
  lightboxProps: LightboxProps;
}