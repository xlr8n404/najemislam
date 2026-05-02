'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function CommunityRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const id = params?.id as string;
    if (id) {
      router.replace(`/community/${id}`);
    } else {
      router.replace('/communities');
    }
  }, [router, params]);

  return null;
}
