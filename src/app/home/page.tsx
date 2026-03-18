'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { PostCard } from '@/components/PostCard';
import { BottomNav } from '@/components/BottomNav';
import { Share2, Search, Settings, Settings2, LogOut, X, MessageCircle, MessageSquare, Plus, Users } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { toast } from 'sonner';
import Link from 'next/link';
import { useGuestMode } from '@/context/GuestModeContext';

const PAGE_SIZE = 10;

export default function HomePage() {
  const router = useRouter();
  const { isGuest } = useGuestMode();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [isGesturing, setIsGesturing] = useState(false);
  const [feedMode, setFeedMode] = useState<'trending' | 'explore' | 'following' | 'sharable' | 'communities'>('trending');
  const [profile, setProfile] = useState<any>(null);
  
  const observer = useRef<IntersectionObserver | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  useEffect(() => {
    if (rightSidebarOpen || leftSidebarOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [rightSidebarOpen, leftSidebarOpen]);

  const fetchPosts = useCallback(async (currentOffset: number, mode: typeof feedMode, isLoadMore: boolean = false) => {
    if (!isLoadMore) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Guests can browse without a user session
      if (!user && !isGuest) {
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      if (user && !profile && !isLoadMore) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (profileData) setProfile(profileData);
      }

      let fetchedPosts: any[] = [];

        if (mode === 'communities') {
          // Fetch user's community posts
          if (!user) {
            // Guests can't see community feed
            setHasMore(false);
            fetchedPosts = [];
          } else {
            // Get user's communities
            const { data: userCommunities } = await supabase
              .from('community_members')
              .select('community_id')
              .eq('user_id', user.id);

            const communityIds = (userCommunities || []).map(m => m.community_id);

            if (communityIds.length === 0) {
              fetchedPosts = [];
            } else {
              // Get approved posts from user's communities
              const { data, error } = await supabase
                .from('community_posts')
                .select(`
                  *,
                  user:profiles(id, full_name, username, avatar_url),
                  community:communities(id, name),
                  likes:community_post_likes(count),
                  comments:community_post_comments(count)
                `)
                .in('community_id', communityIds)
                .eq('is_approved', true)
                .order('created_at', { ascending: false })
                .range(currentOffset, currentOffset + PAGE_SIZE - 1);

              if (error) throw error;
              fetchedPosts = (data || []).map(post => ({
                ...post,
                id: post.id,
                content: post.content,
                media_url: post.media_url,
                media_type: post.media_type,
                user: post.user,
                community: post.community,
                created_at: post.created_at,
                is_community_post: true,
              }));
            }
          }
        } else if (mode === 'trending') {
          // Use RPC for trending posts
          const { data, error } = await supabase.rpc('get_trending_posts', {
            limit_count: PAGE_SIZE,
            offset_count: currentOffset
          });

          if (error) throw error;
          fetchedPosts = data || [];
        } else {
          let query = supabase
            .from('posts')
            .select(`
              *,
              user:profiles!inner(full_name, avatar_url, username),
              original_post:reposted_id(
                *,
                user:profiles(full_name, avatar_url, username)
              )
            `);

          if (mode === 'following') {
            if (!user) {
              // Guests can't see following feed — fall back to explore
              query = query.order('created_at', { ascending: false });
            } else {
              const { data: followsData, error: followsError } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', user.id);

              if (followsError) throw followsError;

              const followingIds = (followsData || []).map(f => f.following_id);
              query = query
                .in('user_id', [...followingIds, user.id])
                .order('created_at', { ascending: false });
            }
          } else if (mode === 'sharable') {
            // Explicitly filter by official account and sort by newest
            query = query
              .eq('user.username', 'sharable')
              .order('created_at', { ascending: false });
          } else {
            // Explore - show newest posts from everyone
            query = query.order('created_at', { ascending: false });
          }

          query = query.range(currentOffset, currentOffset + PAGE_SIZE - 1);
          const { data, error } = await query;
          if (error) throw error;
          fetchedPosts = data || [];
        }

      if (isLoadMore) {
        setPosts(prev => [...prev, ...fetchedPosts]);
      } else {
        setPosts(fetchedPosts);
      }

      setHasMore(fetchedPosts.length === PAGE_SIZE);
      setOffset(currentOffset + fetchedPosts.length);

    } catch (err: any) {
      console.error('Data fetching error:', err);
      toast.error('Failed to load posts: ' + err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [profile, feedMode, isGuest]);

    useEffect(() => {
      setOffset(0);
      setHasMore(true);
      fetchPosts(0, feedMode);

      // Set up Realtime for posts
      const channel = supabase
        .channel('public:posts')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'posts' 
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            // When a new post is added, refresh the first page
            fetchPosts(0, feedMode);
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted post from state
            setPosts(prev => prev.filter(p => p.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            // Update modified post in state
            setPosts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [feedMode, fetchPosts]);

  const loadMorePosts = useCallback(() => {
    if (loadingMore || !hasMore) return;
    fetchPosts(offset, feedMode, true);
  }, [loadingMore, hasMore, offset, feedMode, fetchPosts]);

  const lastPostRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMorePosts]);

  const avatarSrc = profile?.avatar_url
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
    : profile?.full_name
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=default`;

  return (
    <motion.div 
      className="min-h-screen bg-white dark:bg-black text-black dark:text-white selection:bg-black dark:selection:bg-white selection:text-white dark:selection:text-black"
      style={{ touchAction: 'pan-y' }}
      onPanStart={() => setIsGesturing(true)}
      onPanEnd={(e, info) => {
        if (!isGesturing) return;
        setIsGesturing(false);
        const isHorizontal = Math.abs(info.offset.x) > Math.abs(info.offset.y);
        if (isHorizontal) {
          if (info.offset.x > 50) {
            if (rightSidebarOpen) setRightSidebarOpen(false);
            else if (!leftSidebarOpen) setLeftSidebarOpen(true);
          }
          if (info.offset.x < -50) {
            if (leftSidebarOpen) setLeftSidebarOpen(false);
            else if (!rightSidebarOpen) setRightSidebarOpen(true);
          }
        }
      }}
    >
      {/* Left Sidebar (Drawer) */}
      <AnimatePresence>
        {leftSidebarOpen && (
          <div key="sidebar-overlay" className="fixed inset-0 z-[70]">
            <motion.div 
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setLeftSidebarOpen(false)}
            />
            <motion.div 
              key="sidebar-content"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 h-full w-[85%] max-w-[320px] bg-zinc-100 dark:bg-zinc-900 shadow-2xl flex flex-col"
            >
              <div className="p-6 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-3">
                  {(['trending', 'explore', 'following', 'communities', 'sharable'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setFeedMode(mode);
                        setLeftSidebarOpen(false);
                      }}
                      className={`py-4 px-3 rounded-full font-bold text-sm transition-all text-center border-2 capitalize ${
                        feedMode === mode 
                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg' 
                        : 'bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500 border-transparent hover:border-black/20 dark:hover:border-white/20'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div 
                  className="relative cursor-pointer group"
                  onClick={() => {
                    setLeftSidebarOpen(false);
                    router.push('/search');
                  }}
                >
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors" size={20} />
                  <div className="w-full bg-zinc-200/50 dark:bg-zinc-800/50 rounded-2xl py-4 pl-12 pr-4 text-zinc-500 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800 transition-all border border-transparent group-hover:border-black/10 dark:group-hover:border-white/10">
                    Search Sharable
                  </div>
                </div>

                <Link
                  href={isGuest ? '#' : '/post/create'}
                  onClick={(e) => {
                    if (isGuest) {
                      e.preventDefault();
                      setLeftSidebarOpen(false);
                      toast('Sign up to create posts', { description: 'Create an account to share content.' });
                    } else {
                      setLeftSidebarOpen(false);
                    }
                  }}
                  className={`flex items-center gap-3 p-3 bg-zinc-200 dark:bg-zinc-800 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all border border-transparent hover:border-black/10 dark:hover:border-white/10 ${isGuest ? 'opacity-50' : ''}`}
                >
                  <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">Anything Sharable today?</span>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Right Sidebar (Drawer) */}
      <AnimatePresence>
        {rightSidebarOpen && (
          <div key="right-sidebar-overlay" className="fixed inset-0 z-[70]">
            <motion.div 
              key="right-sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setRightSidebarOpen(false)}
            />
            <motion.div 
              key="right-sidebar-content"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-[85%] max-w-[320px] bg-zinc-100 dark:bg-zinc-900 shadow-2xl flex flex-col overflow-y-auto"
            >
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 group">
                      <div className="flex items-center justify-center w-8 h-8">
                        <Share2 size={24} className="text-black dark:text-white" />
                      </div>
                      <span className="font-bold text-xl tracking-tight font-[family-name:var(--font-syne)] text-black dark:text-white">
                        Sharable
                      </span>
                    </div>
                    <button 
                      onClick={() => setRightSidebarOpen(false)}
                      className="p-2 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X size={24} strokeWidth={1.5} />
                    </button>
                  </div>

                  <div 
                    className="relative flex items-center bg-zinc-200 dark:bg-zinc-800 rounded-full px-3 h-12 cursor-pointer"
                    onClick={() => {
                      setRightSidebarOpen(false);
                      router.push('/search');
                    }}
                  >
                    <Search size={24} strokeWidth={1.5} className="text-zinc-400 shrink-0" />
                    <div className="flex-1 px-3 text-zinc-500 text-sm">Search Sharable...</div>
                    <Settings2 size={24} strokeWidth={1.5} className="text-zinc-400 shrink-0" />
                  </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                  {isGuest ? (
                    <button
                      onClick={async () => {
                        setRightSidebarOpen(false);
                        await fetch('/api/auth/guest', { method: 'DELETE' });
                        router.push('/');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-4 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-2xl transition-all"
                    >
                      <LogOut size={24} strokeWidth={1.5} />
                      <span className="font-bold">Sign up / Log in</span>
                    </button>
                  ) : (
                    <>
                  <button
                    onClick={() => {
                      setRightSidebarOpen(false);
                      router.push('/communities');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-4 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-2xl transition-all"
                  >
                    <Users size={24} strokeWidth={1.5} />
                    <span className="font-bold">Communities</span>
                  </button>
                  <button
                    onClick={() => {
                      setRightSidebarOpen(false);
                      router.push('/messages');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-4 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-2xl transition-all"
                  >
                    <MessageCircle size={24} strokeWidth={1.5} />
                    <span className="font-bold">Chats</span>
                  </button>
                  <button
                    onClick={() => {
                      setRightSidebarOpen(false);
                      router.push('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-4 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-2xl transition-all"
                  >
                    <Settings size={24} strokeWidth={1.5} />
                    <span className="font-bold">Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-4 text-red-500 dark:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all mt-4"
                  >
                    <LogOut size={24} strokeWidth={1.5} />
                    <span className="font-bold">Log out</span>
                  </button>
                    </>
                  )}
                </nav>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    
      <header className="fixed top-0 left-0 right-0 h-16 z-50 px-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="h-full flex items-center justify-between">
          <button 
            onClick={() => setLeftSidebarOpen(true)}
            className="p-2 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <Settings2 size={24} strokeWidth={1.5} />
          </button>

          <div className="flex-1 flex justify-center">
            <Share2 
              size={28} 
              className="text-black dark:text-white cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          </div>

          <button
            onClick={() => {
              if (isGuest) {
                toast('Sign up to access messages', { description: 'Create an account to chat with others.' });
                return;
              }
              router.push('/messages');
            }}
            className="p-2 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <MessageCircle size={24} strokeWidth={1.5} />
          </button>
        </div>
      </header>
    
      <main className="max-w-xl mx-auto pt-16 pb-20">
        <div className="px-4 py-4 flex items-center gap-3 border-b border-black/[0.05] dark:border-white/[0.05]">
          <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
            <img 
              src={avatarSrc} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          {isGuest ? (
            <button
              onClick={() => toast('Sign up to post', { description: 'Create an account to share content.' })}
              className="flex-1 h-11 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center px-5 text-zinc-400 dark:text-zinc-600 text-[15px] font-medium cursor-not-allowed"
            >
              Anything Sharable today?
            </button>
          ) : (
            <Link
              href="/post/create"
              className="flex-1 h-11 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center px-5 text-zinc-500 text-[15px] font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              Anything Sharable today?
            </Link>
          )}
        </div>

        <div className="flex flex-col">
          {posts.map((post, index) => (
            <div 
              key={`${post.id}-${index}`} 
              ref={index === posts.length - 1 ? lastPostRef : null}
            >
              <PostCard {...post} onDelete={handleDeletePost} avatarSize={40} />
            </div>
          ))}
        </div>

        {loading && (
          <div className="py-8">
            <Loader />
          </div>
        )}

        {!loading && loadingMore && (
          <div className="py-8">
            <Loader />
          </div>
        )}

        {!loading && !loadingMore && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📭</span>
            </div>
            <h3 className="text-xl font-bold mb-2">No posts yet</h3>
            <p className="text-zinc-500 max-w-[240px]">Be the first to share something with the world!</p>
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="py-12 text-center text-zinc-500 text-sm font-medium">
            You've reached the end of the world. 🌍
          </div>
        )}
      </main>

      <BottomNav />
    </motion.div>
  );
}
