import { supabase } from './supabase';

// Cache for follower relationships to avoid repeated queries
const followerCache = new Map<string, Set<string>>();

export async function checkIfFollower(currentUserId: string | null, authorId: string): Promise<boolean> {
  if (!currentUserId || currentUserId === authorId) {
    return false; // You're not a follower of yourself
  }

  try {
    // Check cache first
    const cacheKey = `${currentUserId}`;
    if (followerCache.has(cacheKey)) {
      return followerCache.get(cacheKey)!.has(authorId);
    }

    // Query database
    const { data, error } = await supabase
      .from('followers')
      .select('following_id')
      .eq('follower_id', currentUserId);

    if (error) {
      console.error('Error checking follower status:', error);
      return false;
    }

    // Cache the result
    const followingIds = new Set(data?.map(f => f.following_id) || []);
    followerCache.set(cacheKey, followingIds);

    return followingIds.has(authorId);
  } catch (error) {
    console.error('Error in checkIfFollower:', error);
    return false;
  }
}

export function formatIdentityTag(
  identityTag: string | null | undefined,
  username: string | null | undefined,
  isFollower: boolean
): { text: string; isTag: boolean } {
  if (isFollower && identityTag) {
    return { text: identityTag, isTag: true };
  }
  
  return { text: username ? `@${username}` : '@user', isTag: false };
}
