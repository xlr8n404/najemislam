'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Users, Settings2, Plus } from 'lucide-react';
import CommunityPostCard from '@/components/CommunityPostCard';
import { supabase } from '@/lib/supabase';
import { BottomNav } from '@/components/BottomNav';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { PostSkeleton } from '@/components/PostSkeleton';

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

  useEffect(() => {
    const getUser = async () => {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      setCurrentUser(data.user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (communityId && currentUser) {
      fetchCommunity();
      fetchPosts();
    } else if (communityId) {
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
          const isMemberCheck = data.community.members?.some((m: any) => m.user_id === currentUser.id);
          setIsMember(!!isMemberCheck);
          setIsAdmin(data.community.creator_id === currentUser.id);
        }
      }
    } catch (error) {
      console.error('Error fetching community:', error);
      toast.error('Failed to load community');
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        user_id: currentUser?.id || '',
        approved_only: isAdmin ? 'false' : 'true',
      });

      const res = await fetch(`/api/communities/${communityId}/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setPostCount(data.posts?.length || 0);
      setLikedPosts(new Set(data.liked_post_ids || []));
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/communities/${communityId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id }),
      });

      if (res.ok) {
        setIsMember(true);
        fetchCommunity();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to join community');
      }
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Error joining community');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setPostLoading(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          content: postContent,
        }),
      });

      if (res.ok) {
        const { data: newPost } = await res.json();
        setPostContent('');
        // Add the new post to the top of the list immediately
        setPosts(prev => [newPost, ...prev]);
        setPostCount(prev => prev + 1);
        toast.success('Post created successfully!');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post');
    } finally {
      setPostLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/communities/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id }),
      });

      if (res.ok) {
        setLikedPosts(prev => new Set([...prev, postId]));
        fetchPosts();
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleUnlike = async (postId: string) => {
    try {
      const res = await fetch(`/api/communities/posts/${postId}/like`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id }),
      });

      if (res.ok) {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        fetchPosts();
      }
    } catch (error) {
      console.error('Error unliking post:', error);
    }
  };

  const handleApprove = async (postId: string) => {
    try {
      const res = await fetch(`/api/communities/posts/${postId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: currentUser.id }),
      });

      if (res.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error('Error approving post:', error);
    }
  };

  if (!community) {
    return (
      <div className="min-h-screen bg-background pb-28 animate-pulse">
        <header className="h-16 flex items-center px-4 bg-background border-b border-black/[0.05] dark:border-white/[0.05]">
          <Skeleton className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800" />
        </header>
        <main className="max-w-xl mx-auto">
          <Skeleton className="w-full h-40 bg-zinc-100 dark:bg-zinc-900 mb-6" />
          <div className="px-4 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-1/2 bg-zinc-200 dark:bg-zinc-800" />
                <Skeleton className="h-4 w-1/4 bg-zinc-100 dark:bg-zinc-900" />
              </div>
            </div>
            <div className="flex gap-6 py-4">
              <Skeleton className="h-4 w-16 bg-zinc-100 dark:bg-zinc-900" />
              <Skeleton className="h-4 w-16 bg-zinc-100 dark:bg-zinc-900" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-zinc-100 dark:bg-zinc-900" />
              <Skeleton className="h-4 w-3/4 bg-zinc-100 dark:bg-zinc-900" />
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Fixed Header - 64dp */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 bg-background hidden">
        <h1 className="text-xl font-bold font-[family-name:var(--font-syne)] truncate">{community.name}</h1>
        {isAdmin && (
          <button
            onClick={() => router.push(`/communities/${communityId}/settings`)}
            className="p-2 text-foreground hover:bg-accent rounded-full transition-colors"
          >
            <Settings2 size={24} strokeWidth={1.5} />
          </button>
        )}
      </header>

      <main className="max-w-xl mx-auto">
        {/* Cover Photo */}
        {community.cover_url && (
          <div className="w-full h-56 bg-muted overflow-hidden">
            <img
              src={community.cover_url}
              alt="Community cover"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Community Info Section */}
        <div className="px-4 py-6">
          {/* Profile Picture & Name */}
          <div className="flex items-start gap-4 mb-4 -mt-14">
            {community.avatar_url && (
              <img
                src={community.avatar_url}
                alt={community.name}
                className="w-28 h-28 rounded-full object-cover flex-shrink-0 border-4 border-white dark:border-black"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{community.name}</h2>
              {community.username && (
                <p className="text-muted-foreground text-sm">@{community.username}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mb-4 text-sm">
            <div>
              <div className="font-bold text-foreground">{postCount}</div>
              <div className="text-muted-foreground">{postCount === 1 ? 'Post' : 'Posts'}</div>
            </div>
            <div>
              <div className="font-bold text-foreground flex items-center gap-1">
                <Users size={16} />
                {memberCount}
              </div>
              <div className="text-muted-foreground">{memberCount === 1 ? 'Member' : 'Members'}</div>
            </div>
          </div>

          {/* Description */}
          {community.description && (
            <p className="text-foreground text-sm leading-relaxed mb-4">
              {community.description}
            </p>
          )}

          {/* Join Button */}
          {currentUser && !isAdmin && !isMember && (
            <button
              onClick={handleJoin}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Join Community
            </button>
          )}
        </div>

        {/* Create Post Section */}
        {isMember && currentUser && (
          <div className="px-4 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Create Post</h3>
            <form onSubmit={handleCreatePost} className="space-y-3">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full px-4 py-3 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPostContent('')}
                  className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors text-sm font-medium"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={postLoading || !postContent.trim()}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {postLoading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts Section */}
        <div className="px-4">
          {loading ? (
            <div className="space-y-4 py-4">
              {[...Array(3)].map((_, i) => (
                <PostSkeleton key={i} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No posts yet</p>
          ) : (
            <div className="space-y-0">
              {posts.map(post => (
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
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
