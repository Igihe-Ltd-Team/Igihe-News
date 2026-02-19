'use client';

import type { LightboxControlsProps } from './Lightbox.types';
import styles from './Lightbox.module.css';

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button className={styles.closeBtn} onClick={onClick} aria-label="Close lightbox">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M3 3L15 15M15 3L3 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

export function NavButton({ direction, onClick }: LightboxControlsProps) {
  return (
    <button
      className={`${styles.navBtn} ${direction === 'prev' ? styles.navBtnPrev : styles.navBtnNext}`}
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Previous image' : 'Next image'}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        {direction === 'prev' ? (
          <path
            d="M13 4L7 10L13 16"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M7 4L13 10L7 16"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}