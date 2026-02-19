'use client';

import { useState } from 'react';
import type { LightboxImageProps } from './Lightbox.types';
import styles from './Lightbox.module.css';

export default function LightboxImage({ image }: LightboxImageProps) {
  // `key` on this component (set by parent) remounts it per image,
  // so a single `loaded` state is safe — no stale-closure / infinite loop.
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={styles.imgWrapper}>
      {!loaded && (
        <div className={styles.spinnerWrap}>
          <div className={styles.spinner} />
        </div>
      )}
      <img
        src={image.src}
        alt={image.alt ?? ''}
        className={`${styles.img} ${loaded ? styles.imgLoaded : styles.imgHidden}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)} // don't hang forever on broken images
        draggable={false}
      />
      {image.alt && <p className={styles.caption}>{image.alt}</p>}
    </div>
  );
}