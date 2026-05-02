'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function StoriesViewRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    router.replace(id ? `/create/story/view?id=${id}` : '/create/story/view');
  }, [router, searchParams]);

  return null;
}

export default function StoriesViewRedirect() {
  return (
    <Suspense>
      <StoriesViewRedirectInner />
    </Suspense>
  );
}
