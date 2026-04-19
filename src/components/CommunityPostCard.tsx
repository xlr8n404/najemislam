'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Trash2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface CommunityPostCardProps {
  post: any;
  isAdmin?: boolean;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onUnlike?: (postId: string) => void;
  onApprove?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  isLiked?: boolean;
}

export default function CommunityPostCard({
  post,
  isAdmin = false,
  currentUserId,
  onLike,
  onUnlike,
  onApprove,
  onDelete,
  isLiked = false,
}: CommunityPostCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLiked) {
        await onUnlike?.(post.id);
      } else {
        await onLike?.(post.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onApprove?.(post.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Delete this post?')) return;
    setIsLoading(true);
    try {
      await onDelete?.(post.id);
    } finally {
      setIsLoading(false);
    }
  };

  const likeCount = post.likes?.[0]?.count || 0;
  const commentCount = post.comments?.[0]?.count || 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <Link href={`/user/${post.user?.username}`} className="flex items-center gap-2 hover:opacity-80">
          {post.user?.avatar_url && (
            <img
              src={post.user.avatar_url}
              alt={post.user.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-zinc-900 dark:text-white">
              {post.user?.full_name}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              @{post.user?.username}
            </p>
          </div>
        </Link>

        {!post.is_approved && (
          <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded">
            Pending
          </span>
        )}
      </div>

      {/* Content */}
      <p className="text-zinc-900 dark:text-white mb-3 text-sm whitespace-pre-wrap break-words">
        {post.content}
      </p>

      {/* Media */}
      {post.media_url && (
        <div className="w-full mb-3">
          {post.media_type === 'video' || (post.media_url && (post.media_url.endsWith('.mp4') || post.media_url.endsWith('.webm') || post.media_url.endsWith('.mov'))) ? (
            <video
              src={post.media_url}
              controls
              className="w-full rounded-lg max-h-96 object-cover"
            />
          ) : (
            <img
              src={post.media_url}
              alt="Post media"
              className="w-full rounded-lg max-h-96 object-cover"
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={isLoading}
            className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-red-500 transition"
          >
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} color={isLiked ? 'red' : 'currentColor'} />
            <span>{likeCount}</span>
          </button>

          <button className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-blue-500 transition">
            <MessageCircle size={16} />
            <span>{commentCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && !post.is_approved && (
            <button
              onClick={handleApprove}
              disabled={isLoading}
              className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded flex items-center gap-1 hover:bg-green-200 dark:hover:bg-green-800 transition"
            >
              <CheckCircle size={14} />
              Approve
            </button>
          )}

          {(isAdmin || currentUserId === post.user_id) && (
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 p-1 rounded transition"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
