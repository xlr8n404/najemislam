import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth-utils';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Allowed buckets — only serve files from these
const ALLOWED_BUCKETS = ['posts', 'avatars', 'covers', 'stories'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Verify authentication
  const sessionToken = request.cookies.get('sb-auth-token')?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(sessionToken);
  if (!payload || !payload.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { path } = await params;
  if (!path || path.length < 2) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const bucket = path[0];
  const filePath = path.slice(1).join('/');

  // Only allow whitelisted buckets
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Prevent path traversal
  const normalised = filePath.replace(/\.\./g, '');
  if (normalised !== filePath) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .download(filePath);

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const contentType = data.type || 'application/octet-stream';

  return new NextResponse(data, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      // Cache media in the browser for 7 days — avoids re-downloading the same image/video on every scroll
      'Cache-Control': 'private, max-age=604800, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
    },
  });
}
