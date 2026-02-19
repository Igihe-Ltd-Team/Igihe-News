'use client';

import type { ThumbnailStripProps } from './Lightbox.types';
import styles from './Lightbox.module.css';

export default function ThumbnailStrip({ images, currentIndex, onSelect }: ThumbnailStripProps) {
  if (!images || images.length <= 1) return null;

  return (
    <div className={styles.thumbStrip}>
      {images.map((img, i) => (
        <button
          key={`${img.src}-${i}`}
          className={`${styles.thumb} ${i === currentIndex ? styles.thumbActive : ''}`}
          onClick={() => onSelect(i)}
          aria-label={`Go to image ${i + 1}`}
          aria-current={i === currentIndex ? 'true' : undefined}
        >
          <img
            src={img.src}
            alt={img.alt ?? ''}
            className={styles.thumbImg}
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
}