'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color = resolvedTheme === 'dark' ? '#000000' : '#ffffff';
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, [resolvedTheme]);

  return null;
}
