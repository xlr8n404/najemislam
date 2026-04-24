import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');
    const approved_only = searchParams.get('approved_only') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('community_posts')
      .select(`
        *,
        user:profiles(id, full_name, username, avatar_url),
        likes:community_post_likes(count),
        comments:community_post_comments(count)
      `, { count: 'exact' })
      .eq('community_id', id);

    // Show all posts for now as requested by user
    // if (approved_only && !user_id) {
    //   query = query.eq('is_approved', true);
    // } else if (user_id) {
    //   // Users can see approved posts or their own posts
    //   query = query.or(`is_approved.eq.true,user_id.eq.${user_id}`);
    // }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Count likes for the current user
    let likes_data = null;
    if (user_id && data) {
      const post_ids = data.map(p => p.id);
      const { data: user_likes } = await supabaseAdmin
        .from('community_post_likes')
        .select('post_id')
        .eq('user_id', user_id)
        .in('post_id', post_ids);

      const liked_post_ids = new Set(user_likes?.map(l => l.post_id) || []);
      return NextResponse.json({ posts: data || [], total: count || 0, liked_post_ids: Array.from(liked_post_ids) });
    }

    return NextResponse.json({ posts: data || [], total: count || 0, liked_post_ids: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user_id, content, media_url, media_type } = await req.json();

    if (!user_id || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user is a member
    const { data: member } = await supabaseAdmin
      .from('community_members')
      .select('id')
      .eq('community_id', id)
      .eq('user_id', user_id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Not a member of this community' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('community_posts')
      .insert({
        community_id: id,
        user_id,
        content,
        media_url: media_url || null,
        media_type: media_type || null,
        is_approved: true,
      })
      .select(`
        *,
        user:profiles(id, full_name, username, avatar_url),
        likes:community_post_likes(count),
        comments:community_post_comments(count)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
