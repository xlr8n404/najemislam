'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { PostCard } from '@/components/PostCard';
import { BottomNav } from '@/components/BottomNav';
import { Share2, Search, Settings, Settings2, LogOut, X, MessageCircle, MessageSquare, Plus, Users, TrendingUp, Navigation, UserRoundPlus, UsersRound } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { PostSkeleton } from '@/components/PostSkeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import { useGuestMode } from '@/context/GuestModeContext';
import { useScrollDirection } from '@/hooks/use-scroll-direction';

const PAGE_SIZE = 10;

type Post = {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  user: { id: string; full_name: string; username: string; avatar_url: string | null; identity_tag?: string | null };
  user_id?: string;
  community?: { id: string; name: string };
  created_at: string;
  is_community_post?: boolean;
  isFollower?: boolean;
  [key: string]: unknown;
};

type Profile = {
  id: string;
  full_name: string | null;
  username: string;
  avatar_url: string | null;
  [key: string]: unknown;
};

export default function HomePage() {
  const router = useRouter();
  const { isGuest } = useGuestMode();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [isGesturing, setIsGesturing] = useState(false);
  const [feedMode, setFeedMode] = useState<'trending' | 'explore' | 'following' | 'sharable' | 'communities'>('trending');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  
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

        // Fetch user's following list
        const { data: followsData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        
        if (followsData) {
          setFollowingIds(new Set(followsData.map(f => f.following_id)));
        }
      }

      let fetchedPosts: Post[] = [];

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
              // Get posts from user's communities
              const { data, error } = await supabase
                .from('community_posts')
                .select(`
                  *,
                  user:profiles!inner(id, full_name, username, avatar_url, identity_tag, is_deactivated),
                  community:communities(id, name),
                  likes:community_post_likes(count),
                  comments:community_post_comments(count)
                `)
                .in('community_id', communityIds)
                // .eq('is_approved', true) // Removed filter to show all posts as requested
                .eq('user.is_deactivated', false)
                .order('created_at', { ascending: false })
                .range(currentOffset, currentOffset + PAGE_SIZE - 1);

              if (error) throw error;
	              fetchedPosts = (data || []).map(post => ({
	                ...post,
	                id: post.id,
	                content: post.content,
	                media_url: post.media_url,
	                media_type: post.media_type,
	                media_urls: post.media_urls || (post.media_url ? [post.media_url] : []),
	                media_types: post.media_types || (post.media_type ? [post.media_type] : []),
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
          fetchedPosts = (data || []).map((post: any) => ({
            ...post,
            media_urls: post.media_urls || (post.media_url ? [post.media_url] : []),
            media_types: post.media_types || (post.media_type ? [post.media_type] : []),
          }));
        } else {
          let query = supabase
            .from('posts')
	            .select(`
	              *,
	              media_urls,
	              media_types,
	              user:profiles!inner(full_name, avatar_url, username, identity_tag, is_deactivated),
	              original_post:reposted_id(
	                *,
	                media_urls,
	                media_types,
	                user:profiles(full_name, avatar_url, username, identity_tag)
	              )
	            `)
            .eq('user.is_deactivated', false);

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
          fetchedPosts = (data || []).map((post: any) => ({
            ...post,
            media_urls: post.media_urls || (post.media_url ? [post.media_url] : []),
            media_types: post.media_types || (post.media_type ? [post.media_type] : []),
          }));

          // Also fetch community posts for explore and following modes
          if (mode === 'explore' || mode === 'following') {
            let communityQuery = supabase
              .from('community_posts')
              .select(`
                *,
                user:profiles!inner(id, full_name, username, avatar_url, identity_tag, is_deactivated),
                community:communities(id, name),
                likes:community_post_likes(count),
                comments:community_post_comments(count)
              `)
              // .eq('is_approved', true) // Removed filter to show all posts as requested
              .eq('user.is_deactivated', false);

            if (mode === 'following' && user) {
              // For following mode, only show community posts from people you follow
              const { data: followsData } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', user.id);
              const followingIds = (followsData || []).map(f => f.following_id);
              communityQuery = communityQuery.in('user_id', [...followingIds, user.id]);
            }

            const { data: communityData } = await communityQuery
              .order('created_at', { ascending: false })
              .range(currentOffset, currentOffset + PAGE_SIZE - 1);

            if (communityData) {
	              const formattedCommunityPosts = communityData.map(post => ({
	                ...post,
	                media_urls: post.media_urls || (post.media_url ? [post.media_url] : []),
	                media_types: post.media_types || (post.media_type ? [post.media_type] : []),
	                is_community_post: true,
	              }));
              fetchedPosts = [...fetchedPosts, ...formattedCommunityPosts]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, PAGE_SIZE);
            }
          }
        }

      if (isLoadMore) {
        setPosts(prev => [...prev, ...fetchedPosts]);
      } else {
        setPosts(fetchedPosts);
      }

      setHasMore(fetchedPosts.length === PAGE_SIZE);
      setOffset(currentOffset + fetchedPosts.length);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Failed to load posts: ' + errorMessage);
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
              className="absolute top-0 left-0 h-full w-[85%] max-w-[320px] bg-white dark:bg-black shadow-2xl flex flex-col overflow-y-auto"
            >
              {/* Top Search Bar - 64dp */}
              <div className="h-16 px-4 py-3 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div className="flex-1 flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 rounded-full px-3 py-2">
                  <Search size={24} className="text-zinc-500 dark:text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="flex-1 bg-transparent text-sm outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                  />
                </div>
                <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors">
                  <Settings2 size={24} className="text-zinc-700 dark:text-zinc-300" />
                </button>
              </div>

              {/* Feed Mode Selection - Icon Only */}
              <div className="px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-around gap-2">
                  <button
                    onClick={() => {
                      setFeedMode('trending');
                      setLeftSidebarOpen(false);
                    }}
                    className={`flex items-center justify-center p-3 rounded-lg transition-all ${
                      feedMode === 'trending' 
                      ? 'bg-black dark:bg-white text-white dark:text-black' 
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                    title="Trending"
                  >
                    <TrendingUp size={24} />
                  </button>
                  <button
                    onClick={() => {
                      setFeedMode('explore');
                      setLeftSidebarOpen(false);
                    }}
                    className={`flex items-center justify-center p-3 rounded-lg transition-all ${
                      feedMode === 'explore' 
                      ? 'bg-black dark:bg-white text-white dark:text-black' 
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                    title="Explore"
                  >
                    <Navigation size={24} />
                  </button>
                  <button
                    onClick={() => {
                      setFeedMode('following');
                      setLeftSidebarOpen(false);
                    }}
                    className={`flex items-center justify-center p-3 rounded-lg transition-all ${
                      feedMode === 'following' 
                      ? 'bg-black dark:bg-white text-white dark:text-black' 
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                    title="Following"
                  >
                    <UserRoundPlus size={24} />
                  </button>
                  <button
                    onClick={() => {
                      setFeedMode('communities');
                      setLeftSidebarOpen(false);
                    }}
                    className={`flex items-center justify-center p-3 rounded-lg transition-all ${
                      feedMode === 'communities' 
                      ? 'bg-black dark:bg-white text-white dark:text-black' 
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                    title="Communities"
                  >
                    <UsersRound size={24} />
                  </button>
                  <button
                    onClick={() => {
                      setFeedMode('sharable');
                      setLeftSidebarOpen(false);
                    }}
                    className={`flex items-center justify-center p-3 rounded-lg transition-all ${
                      feedMode === 'sharable' 
                      ? 'bg-black dark:bg-white text-white dark:text-black' 
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                    title="Sharable"
                  >
                    <Share2 size={24} />
                  </button>
                </div>
              </div>


              {/* Profile Pill Section */}
              <div className="px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
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
                  className={`flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all ${isGuest ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="flex-1 font-medium text-sm text-zinc-700 dark:text-zinc-300 truncate">Anything Sharable Today?</span>
                </Link>
              </div>

              {/* Quick Action Buttons */}
              <div className="px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="grid grid-cols-5 gap-2">
                  <button
                    onClick={() => {
                      setFeedMode('trending');
                      setLeftSidebarOpen(false);
                    }}
                    className="flex flex-col items-center justify-center py-3 px-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                    title="Home"
                  >
                    <span className="text-xl mb-1">🏠</span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Home</span>
                  </button>
                  <button
                    onClick={() => {
                      setLeftSidebarOpen(false);
                      router.push('/search');
                    }}
                    className="flex flex-col items-center justify-center py-3 px-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                    title="Search"
                  >
                    <Search size={20} className="mb-1 text-zinc-700 dark:text-zinc-300" />
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Search</span>
                  </button>
                  <button
                    onClick={() => {
                      setLeftSidebarOpen(false);
                      if (isGuest) {
                        toast('Sign up to create posts', { description: 'Create an account to share content.' });
                      } else {
                        router.push('/post/create');
                      }
                    }}
                    className="flex flex-col items-center justify-center py-3 px-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                    title="Create"
                  >
                    <Plus size={20} className="mb-1 text-zinc-700 dark:text-zinc-300" />
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Create</span>
                  </button>
                  <button
                    onClick={() => {
                      setLeftSidebarOpen(false);
                      if (isGuest) {
                        toast('Sign up to access alerts', { description: 'Create an account to get alerts.' });
                      } else {
                        router.push('/alerts');
                      }
                    }}
                    className="flex flex-col items-center justify-center py-3 px-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                    title="Alerts"
                  >
                    <span className="text-xl mb-1">🔔</span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Alerts</span>
                  </button>
                  <button
                    onClick={() => {
                      setLeftSidebarOpen(false);
                      if (isGuest) {
                        toast('Sign up to access profile', { description: 'Create an account to view your profile.' });
                      } else {
                        router.push('/profile');
                      }
                    }}
                    className="flex flex-col items-center justify-center py-3 px-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                    title="Profile"
                  >
                    <span className="text-xl mb-1">👤</span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Profile</span>
                  </button>
                </div>
              </div>

              {/* Settings Toggles */}
              <div className="flex-1 px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Alerts</span>
                    <button className="relative inline-flex h-6 w-10 items-center rounded-full bg-zinc-300 dark:bg-zinc-700 transition-colors hover:bg-zinc-400 dark:hover:bg-zinc-600">
                      <span className="inline-block h-5 w-5 transform rounded-full bg-white dark:bg-black transition-transform translate-x-0.5"></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Dark Mode</span>
                    <button className="relative inline-flex h-6 w-10 items-center rounded-full bg-zinc-300 dark:bg-zinc-700 transition-colors hover:bg-zinc-400 dark:hover:bg-zinc-600">
                      <span className="inline-block h-5 w-5 transform rounded-full bg-white dark:bg-black transition-transform translate-x-4 dark:translate-x-0.5"></span>
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setLeftSidebarOpen(false);
                      if (!isGuest) {
                        router.push('/settings');
                      }
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg font-medium text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                  >
                    Settings
                  </button>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="px-4 py-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0 space-y-2">
                <button
                  onClick={() => {
                    setLeftSidebarOpen(false);
                    // Handle download app
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  <span>⬇️</span>
                  Download App
                </button>
                <button
                  onClick={() => {
                    // Handle share app
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black dark:bg-zinc-800 text-white rounded-lg font-medium text-sm hover:bg-zinc-900 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Share2 size={18} />
                  Share
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg font-medium text-sm transition-colors"
                >
                  <LogOut size={18} />
                  Log out
                </button>
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
    
      <header className={`fixed top-0 left-0 right-0 h-16 z-50 px-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b-0 transition-transform duration-300 ${
        useScrollDirection() ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="h-full flex items-center justify-between">
          <button 
            onClick={() => setLeftSidebarOpen(true)}
            className="p-2 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <Settings2 size={24} strokeWidth={1.5} />
          </button>

          <div className="flex-1 flex justify-center">
            <Share2 
              size={24} 
              strokeWidth={1.5}
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
    
      <main 
        className="max-w-xl mx-auto pt-16 pb-20"
      >
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
              <PostCard 
                {...post} 
                onDelete={handleDeletePost} 
                avatarSize={40}
                isFollower={post.user_id ? followingIds.has(post.user_id) : false}
              />
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col">
            {[...Array(5)].map((_, i) => (
              <PostSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        )}

        {!loading && loadingMore && (
          <div className="py-4">
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
            🧸
          </div>
        )}
      </main>

      <BottomNav />
    </motion.div>
  );
}
