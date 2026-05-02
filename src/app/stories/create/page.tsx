'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StoriesCreateRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/create/story');
  }, [router]);

  return null;
}
