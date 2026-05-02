'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PostCreateRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/create/post');
  }, [router]);

  return null;
}
