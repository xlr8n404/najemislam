'use client';

import { PostCard } from '@/components/PostCard';

const MEDIA_PROXY_BASE = '/api/media';

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

function toProxyUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('/api/media/')) return url;
  const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
  if (match) return `${MEDIA_PROXY_BASE}/${match[1]}/${match[2]}`;
  if (!url.startsWith('http')) return `${MEDIA_PROXY_BASE}/${url}`;
  return url;
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
  const likeCount = post.likes?.[0]?.count ?? post.likes_count ?? 0;
  const commentCount = post.comments?.[0]?.count ?? post.comments_count ?? 0;

  const avatarUrl = post.user?.avatar_url
    ? `${MEDIA_PROXY_BASE}/avatars/${post.user.avatar_url}`
    : undefined;

  const mediaUrl = toProxyUrl(post.media_url);

  return (
    <PostCard
      id={post.id}
      user_id={post.user_id}
      user={{
        full_name: post.user?.full_name || post.user?.username || 'Unknown',
        avatar_url: post.user?.avatar_url || null,
        username: post.user?.username,
        identity_tag: null,
      }}
      content={post.content || ''}
      media_url={mediaUrl}
      media_type={post.media_type || null}
      likes_count={Number(likeCount)}
      comments_count={Number(commentCount)}
      reposts_count={0}
      created_at={post.created_at}
      currentUserId={currentUserId}
      initialLiked={isLiked}
      onDelete={onDelete}
    />
  );
}
