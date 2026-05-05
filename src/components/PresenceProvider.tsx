'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Initial heartbeat
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/presence/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
      } catch (error) {
        console.error('Failed to send heartbeat:', error);
      }
    };

    sendHeartbeat();

    // Set up interval for heartbeat (every 30 seconds)
    const interval = setInterval(sendHeartbeat, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  return <>{children}</>;
}
