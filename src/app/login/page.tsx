'use client';

import { useEffect } from 'react';

export default function LoginRedirect() {
  useEffect(() => {
    window.location.replace('/');
  }, []);
  return null;
}
