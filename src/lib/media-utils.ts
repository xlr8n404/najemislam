/**
 * Media URL utilities.
 *
 * All user-generated media is served through our authenticated proxy at /api/media/.
 * This hides the raw Supabase storage URLs from the browser — users never see the
 * underlying storage bucket/path, and unauthenticated requests are rejected server-side.
 */

const MEDIA_PROXY = '/api/media';

/**
 * Convert any storage path or full Supabase URL into a proxy URL.
 * - "avatars/filename.jpg"                        → /api/media/avatars/filename.jpg
 * - "https://<project>.supabase.co/storage/v1/object/public/avatars/filename.jpg"
 *                                                  → /api/media/avatars/filename.jpg
 * - Already-proxied URLs are returned unchanged.
 */
export function toProxyUrl(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null;
  if (urlOrPath.startsWith(`${MEDIA_PROXY}/`)) return urlOrPath;

  // Full Supabase storage URL
  const match = urlOrPath.match(/\/storage\/v1\/object\/public\/([^?#]+)/);
  if (match) return `${MEDIA_PROXY}/${match[1]}`;

  // Relative path (no leading slash)
  if (!urlOrPath.startsWith('http') && !urlOrPath.startsWith('/')) {
    return `${MEDIA_PROXY}/${urlOrPath}`;
  }

  return urlOrPath;
}

export function avatarUrl(path: string | null | undefined, name: string): string {
  if (path) {
    const proxy = toProxyUrl(path);
    if (proxy) return proxy;
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'User')}`;
}

export function coverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return toProxyUrl(path);
}
