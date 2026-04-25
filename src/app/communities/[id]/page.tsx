'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Users, ArrowLeft, CircleUser } from 'lucide-react';
import CommunityPostCard from '@/components/CommunityPostCard';
import { supabase } from '@/lib/supabase';
import { BottomNav } from '@/components/BottomNav';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { PostSkeleton } from '@/components/PostSkeleton';

const SUPABASE_STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public';

export default function CommunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [memberCount, setMemberCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [joinLoading, setJoinLoading] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      setCurrentUser(data.user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (communityId) {
      fetchCommunity();
      fetchPosts();
    }
  }, [communityId, currentUser]);

  const fetchCommunity = async () => {
    try {
      const res = await fetch(`/api/communities/${communityId}`);
      const data = await res.json();
      if (data.community) {
        setCommunity(data.community);
        setMemberCount(data.community.members?.length || 0);
        if (currentUser) {
          setIsMember(!!data.community.members?.some((m: any) => m.user_id === currentUser.id));
          setIsAdmin(data.community.creator_id === currentUser.id);
        }
      }
    } catch (error) {
      toast.error('Failed to load community');
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({
        user_id: currentUser?.id || '',
        approved_only: isAdmin ? 'false' : 'true',
      });
      const res = await fetch(`/api/communities/${communityId}/posts?${p}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setPostCount(data.posts?.length || 0);
      setLikedPosts(new Set(data.liked_post_ids || []));
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!currentUser) { router.push('/login'); return; }
    setJoinLoading(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id }),
      });
      if (res.ok) {
        setIsMember(true);
        setMemberCount(prev => prev + 1);
        toast.success('Joined community!');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to join');
      }
    } catch { toast.error('Error joining community'); }
    finally { setJoinLoading(false); }
  };

  const handleLeave = async () => {
    if (!currentUser) return;
    setJoinLoading(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id }),
      });
      if (res.ok) {
        setIsMember(false);
        setMemberCount(prev => Math.max(0, prev - 1));
        toast.success('Left community');
      } else {
        toast.error('Failed to leave');
      }
    } catch { toast.error('Error leaving community'); }
    finally { setJoinLoading(false); }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    setPostLoading(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, content: postContent }),
      });
      if (res.ok) {
        const { data: newPost } = await res.json();
        setPostContent('');
        setShowPostForm(false);
        setPosts(prev => [newPost, ...prev]);
        setPostCount(prev => prev + 1);
        toast.success('Post created!');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create post');
      }
    } catch { toast.error('Error creating post'); }
    finally { setPostLoading(false); }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) { router.push('/login'); return; }
    const res = await fetch(`/api/communities/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id }),
    });
    if (res.ok) { setLikedPosts(prev => new Set([...prev, postId])); fetchPosts(); }
  };

  const handleUnlike = async (postId: string) => {
    const res = await fetch(`/api/communities/posts/${postId}/like`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id }),
    });
    if (res.ok) {
      setLikedPosts(prev => { const s = new Set(prev); s.delete(postId); return s; });
      fetchPosts();
    }
  };

  const handleApprove = async (postId: string) => {
    const res = await fetch(`/api/communities/posts/${postId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_id: currentUser.id }),
    });
    if (res.ok) fetchPosts();
  };

  const userAvatarSrc = currentUser?.profile?.avatar_url
    ? `${SUPABASE_STORAGE_URL}/avatars/${currentUser.profile.avatar_url}`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.user_metadata?.full_name || 'user'}`;

  if (!community) {
    return (
      <div className="min-h-screen bg-background pb-28 animate-pulse">
        <div className="max-w-xl mx-auto">
          {/* Cover */}
          <Skeleton className="w-full bg-zinc-100 dark:bg-zinc-900" style={{height: '120px'}} />
          <div className="px-4">
            {/* DP halfway down */}
            <div className="-mt-10 mb-6">
              <Skeleton className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800 border-4 border-white dark:border-black" />
            </div>
            {/* Name + username */}
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-6 w-36 bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-4 w-20 bg-zinc-100 dark:bg-zinc-900" />
            </div>
            {/* Stats */}
            <div className="flex gap-4 mb-4">
              <Skeleton className="h-4 w-16 bg-zinc-100 dark:bg-zinc-900" />
              <Skeleton className="h-4 w-20 bg-zinc-100 dark:bg-zinc-900" />
            </div>
            {/* Description */}
            <Skeleton className="h-4 w-full bg-zinc-100 dark:bg-zinc-900 mb-2" />
            <Skeleton className="h-4 w-3/4 bg-zinc-100 dark:bg-zinc-900 mb-5" />
            {/* Join button */}
            <Skeleton className="h-10 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 mb-5" />
            {/* Post bar */}
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex-shrink-0" />
              <Skeleton className="flex-1 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900" />
            </div>
          </div>
          {/* Post skeletons */}
          <div className="mt-6">
            {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-xl mx-auto">
        {/* Cover + DP */}
        <div className="relative">
          <button
            onClick={() => router.back()}
            className="absolute top-3 left-3 z-10 p-2 bg-black/40 backdrop-blur-sm text-white rounded-full"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Cover */}
          <div className="w-full overflow-hidden" style={{height: '120px'}}>
            {community.cover_url ? (
              <img src={community.cover_url} alt="cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900" />
            )}
          </div>

          {/* Community DP */}
          <div className="absolute -bottom-10 left-4 w-20 h-20">
            <div className="w-full h-full rounded-full border-4 border-white dark:border-black overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              {community.avatar_url ? (
                <img src={community.avatar_url} alt={community.name} className="w-full h-full object-cover" />
              ) : (
                <CircleUser size={40} strokeWidth={1} className="text-zinc-400 dark:text-zinc-600" />
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-14 px-4">
          {/* Name + username */}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{community.name}</h1>
            {community.username && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">@{community.username}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3">
            <div>
              <span className="font-bold text-foreground">{postCount}</span>
              <span className="text-zinc-500 text-sm ml-1">Posts</span>
            </div>
            <div>
              <span className="font-bold text-foreground">{memberCount}</span>
              <span className="text-zinc-500 text-sm ml-1">Members</span>
            </div>
          </div>

          {/* Description */}
          {community.description && (
            <p className="mt-4 text-zinc-700 dark:text-zinc-300 text-[15px] leading-relaxed">
              {community.description}
            </p>
          )}

          {/* Join / Leave button */}
          {currentUser && !isAdmin && (
            <button
              onClick={isMember ? handleLeave : handleJoin}
              disabled={joinLoading}
              className={`w-full mt-5 py-2.5 font-bold text-sm rounded-full transition-colors disabled:opacity-50 ${
                isMember
                  ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-black/10 dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-900/50 hover:border-red-500/50 hover:text-red-500'
                  : 'bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200'
              }`}
            >
              {joinLoading ? '...' : isMember ? 'Leave Community' : 'Join Community'}
            </button>
          )}

          {/* Post create bar */}
          {(isMember || isAdmin) && currentUser && (
            <div className="mt-5 mb-2">
              {!showPostForm ? (
                <div className="flex items-center gap-3">
                  <img
                    src={userAvatarSrc}
                    alt="You"
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <button
                    onClick={() => setShowPostForm(true)}
                    className="flex-1 text-left px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 rounded-full text-sm border border-black/5 dark:border-white/5 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                  >
                    What's on your mind?
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreatePost} className="space-y-3 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-black/5 dark:border-white/5">
                  <div className="flex items-start gap-3">
                    <img src={userAvatarSrc} alt="You" className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5" />
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="What's on your mind?"
                      rows={3}
                      autoFocus
                      className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground resize-none text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1 border-t border-black/5 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => { setShowPostForm(false); setPostContent(''); }}
                      className="px-4 py-1.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={postLoading || !postContent.trim()}
                      className="px-5 py-1.5 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                      {postLoading ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Posts */}
        <div className="mt-4">
          {loading ? (
            <div className="space-y-0">
              {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                <Users size={24} strokeWidth={1.5} className="text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">No posts yet</h3>
              <p className="text-zinc-500 max-w-[240px]">Be the first to post in this community!</p>
            </div>
          ) : (
            posts.map(post => (
              <CommunityPostCard
                key={post.id}
                post={post}
                isAdmin={isAdmin}
                currentUserId={currentUser?.id}
                onLike={handleLike}
                onUnlike={handleUnlike}
                onApprove={handleApprove}
                isLiked={likedPosts.has(post.id)}
              />
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
