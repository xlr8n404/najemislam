'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function UserRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const username = params?.username as string;
    if (username) {
      router.replace(`/${username}`);
    } else {
      router.replace('/home');
    }
  }, [router, params]);

  return null;
}
