'use client';

import { useEffect } from 'react';

export default function RegisterRedirect() {
  useEffect(() => {
    window.location.replace('/');
  }, []);
  return null;
}
