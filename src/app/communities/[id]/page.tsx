'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Users, ArrowLeft, Plus } from 'lucide-react';
import CommunityPostCard from '@/components/CommunityPostCard';
import { supabase } from '@/lib/supabase';

export default function CommunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());

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

        if (currentUser) {
          const isMemberCheck = data.community.members?.some((m: any) => m.user_id === currentUser.id);
          setIsMember(!!isMemberCheck);
          setIsAdmin(data.community.creator_id === currentUser.id);
        }
      }
    } catch (error) {
      console.error('Error fetching community:', error);
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
      setLikedPosts(new Set(data.liked_post_ids || []));
    } catch (error) {
      console.error('Error fetching posts:', error);
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
        setPostContent('');
        fetchPosts();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create post');
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
      <div className="min-h-screen bg-zinc-50 dark:bg-black pt-20 pb-20">
        <div className="max-w-4xl mx-auto px-4">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-8"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Community Info */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-8">
          <div className="flex gap-4 mb-4">
            {community.avatar_url && (
              <img
                src={community.avatar_url}
                alt={community.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                {community.name}
              </h1>
              {community.description && (
                <p className="text-zinc-600 dark:text-zinc-400 mb-3">
                  {community.description}
                </p>
              )}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <Users size={16} />
                  <span>{community.members?.length || 0} members</span>
                </div>
                {community.category && (
                  <span className="text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded-full">
                    {community.category}
                  </span>
                )}
              </div>
            </div>

            {/* Join/Leave Button */}
            {currentUser && !isAdmin && (
              <div>
                {isMember ? (
                  <div className="text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-4 py-2 rounded">
                    Member
                  </div>
                ) : (
                  <button
                    onClick={handleJoin}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                  >
                    <Plus size={16} />
                    Join
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Post Section */}
        {isMember && currentUser && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-8">
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-white mb-4">
              Share something with the community
            </h3>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={postLoading || !postContent.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {postLoading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts */}
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            {isAdmin ? 'All Posts' : 'Posts'}
          </h2>

          {loading ? (
            <p className="text-center text-zinc-600 dark:text-zinc-400 py-8">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-center text-zinc-600 dark:text-zinc-400 py-8">No posts yet</p>
          ) : (
            <div>
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
      </div>
    </div>
  );
}
