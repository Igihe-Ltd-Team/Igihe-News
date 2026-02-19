'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton, NavButton } from './LightboxControls';
import LightboxImage from './LightboxImage';
import ThumbnailStrip from './ThumbnailStrip';
import type { LightboxProps } from './Lightbox.types';
import styles from './Lightbox.module.css';

export default function Lightbox({ isOpen, images, startIndex, onClose }: LightboxProps) {
  const [current, setCurrent] = useState<number>(startIndex ?? 0);
  const [mounted, setMounted] = useState<boolean>(false);
  const touchStartX = useRef<number | null>(null);

  // Required for createPortal in Next.js (SSR safe)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync to new startIndex whenever lightbox opens
  useEffect(() => {
    if (isOpen) setCurrent(startIndex ?? 0);
  }, [isOpen, startIndex]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const total = images.length;

  const goNext = useCallback(() => {
    setCurrent((c) => (c + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrent((c) => (c - 1 + total) % total);
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, goNext, goPrev, onClose]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
    touchStartX.current = null;
  };

  if (!mounted || !isOpen || !images.length) return null;

  const currentImage = images[current];

  return createPortal(
    <div
      className={styles.overlay}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      <div className={styles.backdrop} />

      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.counter}>{current + 1} / {total}</span>
          <CloseButton onClick={onClose} />
        </div>

        {/* Stage */}
        <div className={styles.stage}>
          {total > 1 && <NavButton direction="prev" onClick={goPrev} />}

          {/*
            Key = src + current index: remounts LightboxImage on every navigation.
            This is the fix for infinite spinner — each mount starts with loaded=false
            and fires onLoad exactly once for the new image.
          */}
          <LightboxImage
            key={`${currentImage.src}-${current}`}
            image={currentImage}
          />

          {total > 1 && <NavButton direction="next" onClick={goNext} />}
        </div>

        {/* Thumbnails */}
        <ThumbnailStrip images={images} currentIndex={current} onSelect={setCurrent} />
      </div>
    </div>,
    document.body
  );
}