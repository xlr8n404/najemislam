'use client';

import { useEffect } from 'react';

export default function MediaContextMenuBlocker() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'IMG' ||
        target.tagName === 'VIDEO' ||
        target.tagName === 'AUDIO' ||
        target.tagName === 'SVG' ||
        target.closest('img') ||
        target.closest('video') ||
        target.closest('audio') ||
        target.closest('svg')
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  return null;
}
