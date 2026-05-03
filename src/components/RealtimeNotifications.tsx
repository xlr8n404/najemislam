'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';

// Notification label by type
function getNotifLabel(type: string, fromName: string): { title: string; body: string } {
  switch (type) {
    case 'like':
      return { title: 'Sharable', body: `${fromName} liked your post` };
    case 'comment':
      return { title: 'Sharable', body: `${fromName} commented on your post` };
    case 'follow':
      return { title: 'Sharable', body: `${fromName} started following you` };
    case 'repost':
      return { title: 'Sharable', body: `${fromName} reposted your post` };
    case 'mention':
      return { title: 'Sharable', body: `${fromName} mentioned you` };
    case 'message':
      return { title: 'New message', body: `${fromName} sent you a message` };
    default:
      return { title: 'Sharable', body: `${fromName} interacted with you` };
  }
}

// Register service worker and subscribe to Web Push
async function registerPushSubscription() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }

  try {
    // Register (or get existing) service worker
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

    // Ask for permission only if not already granted/denied
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }
    if (Notification.permission !== 'granted') return;

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) return; // VAPID not configured — skip

    // Convert VAPID public key to Uint8Array
    const urlBase64ToUint8Array = (base64String: string) => {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
    };

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // Save subscription to backend
    await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
      credentials: 'include',
    });
  } catch (err) {
    // Push setup is best-effort — don't block app
    console.warn('Push subscription setup failed:', err);
  }
}

export default function RealtimeNotifications() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const user_id = session.user.id;

      // Register service worker + request push permission
      registerPushSubscription();

      // ── Realtime: notifications table ───────────────────────────────
      const notificationsChannel = supabase
        .channel(`global-notifications:${user_id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user_id}`,
        }, async (payload) => {
          const notification = payload.new as any;

          // Fetch sender name for toast label
          let fromName = 'Someone';
          if (notification.from_user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', notification.from_user_id)
              .maybeSingle();
            if (profile?.full_name) fromName = profile.full_name;
          }

          const { body } = getNotifLabel(notification.type, fromName);

          // Determine deep-link URL for this notification
          let targetUrl = '/alerts';
          if (notification.type === 'follow') {
            // Will be handled on alerts page click
            targetUrl = '/alerts';
          } else if (notification.post_id) {
            targetUrl = `/post/${notification.post_id}`;
          }

          // Send push notification via server route (best-effort)
          fetch('/api/push-notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              user_id,
              title: 'Sharable',
              body,
              url: targetUrl,
            }),
          }).catch(() => {});

          // In-app toast — only when not already on alerts page
          if (pathname !== '/alerts') {
            toast(body, {
              action: {
                label: 'View',
                onClick: () => router.push('/alerts'),
              },
            });
          }
        })
        .subscribe();

      // ── Realtime: messages table ─────────────────────────────────────
      const messagesChannel = supabase
        .channel(`global-messages:${user_id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, async (payload) => {
          const msg = payload.new as any;

          // Check if this conversation belongs to me
          const { data: conv } = await supabase
            .from('conversations')
            .select('id, user1_id, user2_id')
            .eq('id', msg.conversation_id)
            .single();

          if (!conv || (conv.user1_id !== user_id && conv.user2_id !== user_id)) return;
          if (msg.sender_id === user_id) return; // my own message

          // Fetch sender name
          let fromName = 'Someone';
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', msg.sender_id)
            .maybeSingle();
          if (profile?.full_name) fromName = profile.full_name;

          // Insert a notification row for the message (best-effort, no await)
          Promise.resolve(supabase.from('notifications').insert({
            user_id,
            from_user_id: msg.sender_id,
            type: 'message',
            post_id: null,
          })).catch(() => {});

          // Send push notification
          fetch('/api/push-notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              user_id,
              title: 'New message',
              body: `${fromName}: ${(msg.content || '').slice(0, 80)}`,
              url: '/messages',
            }),
          }).catch(() => {});

          // In-app toast
          if (pathname !== '/messages') {
            toast(`${fromName} sent you a message`, {
              description: (msg.content || '').slice(0, 80),
              action: {
                label: 'Reply',
                onClick: () => router.push('/messages'),
              },
            });
          }
        })
        .subscribe();

      cleanup = () => {
        supabase.removeChannel(notificationsChannel);
        supabase.removeChannel(messagesChannel);
      };
    };

    setup();

    return () => {
      if (cleanup) cleanup();
    };
  }, [pathname, router]);

  return null;
}
