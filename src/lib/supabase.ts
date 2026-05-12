import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

const baseSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// In-memory session cache — avoids hammering /api/auth/session on every component mount.
// TTL: 60s. Cleared on sign-out.
let _sessionCache: { user: any; expiresAt: number } | null = null;
let _sessionInflight: Promise<any> | null = null;
let _listeners: ((event: string, session: any) => void)[] = [];

async function fetchSession() {
  if (_sessionCache && Date.now() < _sessionCache.expiresAt) {
    return _sessionCache.user;
  }
  // Deduplicate concurrent calls
  if (_sessionInflight) return _sessionInflight;
  _sessionInflight = fetch('/api/auth/session')
    .then(r => r.json())
    .then(data => {
      if (data.user) {
        _sessionCache = { user: data.user, expiresAt: Date.now() + 60_000 };
        return data.user;
      }
      _sessionCache = null;
      return null;
    })
    .catch(() => null)
    .finally(() => { _sessionInflight = null; });
  return _sessionInflight;
}

function notifyListeners(event: string, user: any) {
  const session = user ? {
    user,
    access_token: 'mock-token',
    refresh_token: 'mock-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  } : null;
  _listeners.forEach(cb => cb(event, session));
}

// Custom auth proxy to use our own session API
const authProxy = {
  ...baseSupabase.auth,
  getUser: async () => {
    try {
      const user = await fetchSession();
      if (user) return { data: { user }, error: null };
      return { data: { user: null }, error: new Error('No session') };
    } catch (error) {
      return { data: { user: null }, error };
    }
  },
  getSession: async () => {
    try {
      const user = await fetchSession();
      if (user) {
        return {
          data: {
            session: {
              user,
              access_token: 'mock-token',
              refresh_token: 'mock-token',
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            }
          },
          error: null
        };
      }
      return { data: { session: null }, error: null };
    } catch (error) {
      return { data: { session: null }, error };
    }
  },
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    _listeners.push(callback);
    
    // Immediately call with current state
    fetchSession().then(user => {
      const session = user ? {
        user,
        access_token: 'mock-token',
        refresh_token: 'mock-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      } : null;
      callback('INITIAL_SESSION', session);
    });

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            _listeners = _listeners.filter(l => l !== callback);
          }
        }
      }
    };
  },
  signOut: async () => {
    _sessionCache = null;
    _sessionInflight = null;
    await fetch('/api/auth/logout', { method: 'POST' });
    notifyListeners('SIGNED_OUT', null);
    return { error: null };
  }
};

export const supabase = new Proxy(baseSupabase, {
  get(target, prop) {
    if (prop === 'auth') {
      return authProxy;
    }
    return (target as any)[prop];
  }
});
