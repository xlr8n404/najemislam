'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Loader } from '@/components/ui/loader';
import { Share2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [checking, setChecking] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.user) {
          router.replace('/home');
        } else {
          setChecking(false);
        }
      } catch {
        setChecking(false);
      }
    };
    checkSession();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground font-sans transition-colors duration-300">
      <div className="fixed top-0 left-0 w-full p-6 z-50 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="flex items-center justify-center p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        )}
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-sm mx-auto w-full py-20">
        <div className="mb-8 flex items-center gap-2">
          <Share2 className="w-8 h-8" />
          <span className="font-bold text-2xl tracking-tighter">Sharable</span>
        </div>
        <LoginForm onSwitchToRegister={() => router.push('/register')} />
      </main>
    </div>
  );
}
