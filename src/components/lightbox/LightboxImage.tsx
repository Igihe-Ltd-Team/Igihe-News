'use client';

import { useState } from 'react';
import type { LightboxImageProps } from './Lightbox.types';
import styles from './Lightbox.module.css';
import { ThemedText } from '../ThemedText';

const parseCustomMarkup = (content: string) => {
    if (!content) return '';

    return content
        // Convert [text->url] to <a href="url">text</a>
        .replace(/\[([^\]]+)->([^\]]+)\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        // Convert {{text}} to <strong>text</strong>
        .replace(/\{\{([^}]+)\}\}/g, '<strong>$1</strong>')
        .replace(/&#8217;/g, "'")
        .replace(/&#8216;/g, "'")   // opening single quote
        .replace(/&#8220;/g, '"')   // opening double quote
        .replace(/&#8221;/g, '"')   // closing double quote
        .replace(/&#8211;/g, '–')   // en dash
        .replace(/&#8212;/g, '—')   // em dash
        .replace(/&#038;/g, '&')    // ampersand
        .replace(/&amp;/g, '&')     // ampersand (named)
        // Convert [text->url] to <a>
        .replace(/\[([^\]]+)->([^\]]+)\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        // Convert {{text}} to <strong>
        .replace(/\{\{([^}]+)\}\}/g, '<strong>$1</strong>');
};

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
      {image.caption && <p className={styles.caption}>{parseCustomMarkup(image.caption)}</p>}
    </div>
  );
}