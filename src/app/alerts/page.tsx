'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { BottomNav } from '@/components/BottomNav';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { Heart, MessageCircle, UserPlus, Menu, X, Settings, LogOut, Share2 } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Alert {
  id: string;
  type: 'like' | 'comment' | 'follow';
  read: boolean;
  created_at: string;
  post_id: string | null;
from_user: {
full_name: string;
avatar_url: string;
username: string;
};

}

export default function AlertsPage() {
  const isHeaderVisible = useScrollDirection();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          read,
          created_at,
          post_id,
          from_user:profiles!notifications_from_user_id_fkey(full_name, avatar_url, username)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });


    if (!error && data) {
      setAlerts(data as unknown as Alert[]);
      
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
    }
    
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchAlerts();

    // Subscribe to notifications changes
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchAlerts(false); // Refresh without full loading spinner
        })
        .subscribe();

      return channel;
    };

    let channel: any;
    setupRealtime().then(c => channel = c);

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  const getAvatarSrc = (alert: Alert) => {
    return alert.from_user.avatar_url
      ? `/api/media/avatars/${alert.from_user.avatar_url}`
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${alert.from_user.full_name}`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={12} strokeWidth={1.5} className="text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageCircle size={12} strokeWidth={1.5} className="text-blue-500" />;
      case 'follow':
        return <UserPlus size={12} strokeWidth={1.5} className="text-green-500" />;
      default:
        return null;
    }
  };

  const getMessage = (alert: Alert) => {
    switch (alert.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      default:
        return '';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white selection:bg-black dark:selection:bg-white selection:text-white dark:selection:text-black">
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      } border-b border-black/[0.05] dark:border-white/[0.05]`}>
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-bold text-[22px] tracking-tight font-[family-name:var(--font-syne)]">
            Alerts
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto pt-16 pb-20">
        {loading ? (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-4 animate-pulse">
                <Skeleton className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-zinc-100 dark:bg-zinc-900" />
                  <Skeleton className="h-3 w-1/4 bg-zinc-50 dark:bg-zinc-950" />
                </div>
              </div>
            ))}
          </div>
        ) : alerts.length > 0 ? (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => {
                  if (alert.type === 'follow') {
                    router.push(`/${alert.from_user.username}`);
                  } else if (alert.post_id) {
                    router.push(`/post/${alert.post_id}`);
                  }
                }}
                className={`flex items-start gap-3 p-4 transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 ${
                  !alert.read ? 'bg-black/5 dark:bg-white/5' : ''
                }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-black/10 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900">
                      <img
                        src={getAvatarSrc(alert)}
                        alt={alert.from_user.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-black rounded-full border border-black/5 dark:border-white/5 shadow-sm">
                      {getIcon(alert.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold leading-tight">{alert.from_user.full_name}</p>
                    <p className="text-[14px] text-zinc-500 dark:text-zinc-400 mt-0.5">{getMessage(alert)}</p>
                    <p className="text-[12px] text-zinc-400 dark:text-zinc-600 mt-0.5">{formatTime(alert.created_at)}</p>
                  </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="text-xl font-bold mb-2">No alerts yet</h3>
            <p className="text-zinc-500 max-w-[240px]">When someone interacts with your posts, you'll see it here.</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
