import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth-utils';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('sb-auth-token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

export async function POST(req: NextRequest) {
  try {
    const authUserId = await getAuthUserId(req);
    if (!authUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { follower_id, following_id } = await req.json();

    if (!follower_id || !following_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Caller can only follow as themselves
    if (follower_id !== authUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (follower_id === following_id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('follows')
      .insert({ follower_id, following_id })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already following' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUserId = await getAuthUserId(req);
    if (!authUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { follower_id, following_id } = await req.json();

    if (!follower_id || !following_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Caller can only unfollow as themselves
    if (follower_id !== authUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('follows')
      .delete()
      .eq('follower_id', follower_id)
      .eq('following_id', following_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');
    const type = searchParams.get('type');

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    if (type === 'followers') {
      const { data, error } = await supabaseAdmin
        .from('follows')
        .select('follower_id, profiles!follows_follower_id_fkey(id, full_name, username, avatar_url)')
        .eq('following_id', user_id);

      if (error) throw error;
      return NextResponse.json({ data, count: data?.length || 0 });
    }

    if (type === 'following') {
      const { data, error } = await supabaseAdmin
        .from('follows')
        .select('following_id, profiles!follows_following_id_fkey(id, full_name, username, avatar_url)')
        .eq('follower_id', user_id);

      if (error) throw error;
      return NextResponse.json({ data, count: data?.length || 0 });
    }

    const { data: followersData } = await supabaseAdmin
      .from('follows')
      .select('follower_id')
      .eq('following_id', user_id);

    const { data: followingData } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('follower_id', user_id);

    return NextResponse.json({
      followers_count: followersData?.length || 0,
      following_count: followingData?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
