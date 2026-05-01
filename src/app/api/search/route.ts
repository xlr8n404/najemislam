import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth-utils';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Search requires authentication
    const token = req.cookies.get('sb-auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';
    const isRandom = searchParams.get('random') === 'true';

    // Handle random content requests
    if (isRandom) {
      if (type === 'users') {
        const { data: users, error } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, username, avatar_url, bio')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        return NextResponse.json({ users: users || [] });
      }

      if (type === 'posts') {
        const { data: posts, error } = await supabaseAdmin
          .from('posts')
          .select(`
            id,
            content,
            media_url,
            media_type,
            created_at,
            user:profiles(id, full_name, username, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        return NextResponse.json({ posts: posts || [] });
      }

      if (type === 'communities') {
        const { data: communities, error } = await supabaseAdmin
          .from('communities')
          .select(`
            *,
            creator:profiles(id, full_name, username, avatar_url),
            members:community_members(count)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        return NextResponse.json({ communities: communities || [] });
      }

      if (type === 'stories') {
        const { data: stories } = await supabaseAdmin
          .from('stories')
          .select(`id, caption, photo_url, created_at, user:profiles(id, full_name, username, avatar_url)`)
          .order('created_at', { ascending: false })
          .limit(20);
        return NextResponse.json({ stories: stories || [] });
      }

      // Get all random content (users, posts, hashtags, communities)
      const [usersRes, postsRes, communitiesRes] = await Promise.all([
        supabaseAdmin
          .from('profiles')
          .select('id, full_name, username, avatar_url, bio')
          .order('created_at', { ascending: false })
          .limit(5),
        supabaseAdmin
          .from('posts')
          .select(`
            id,
            content,
            media_url,
            media_type,
            created_at,
            user:profiles(id, full_name, username, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .limit(5),
        supabaseAdmin
          .from('communities')
          .select(`
            *,
            creator:profiles(id, full_name, username, avatar_url),
            members:community_members(count)
          `)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      return NextResponse.json({
        users: usersRes.data || [],
        posts: postsRes.data || [],
        hashtags: postsRes.data || [],
        communities: communitiesRes.data || [],
      });
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [], posts: [], communities: [] });
    }

    const searchTerm = `%${query}%`;

    if (type === 'users' || type === 'all') {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, username, avatar_url, bio')
        .or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
        .limit(20);

      if (usersError) throw usersError;

      if (type === 'users') {
        return NextResponse.json({ users: users || [] });
      }

      if (type === 'all') {
        const [postsRes, communitiesRes] = await Promise.all([
          supabaseAdmin
            .from('posts')
            .select(`
              id,
              content,
              media_url,
              media_type,
              created_at,
              user:profiles(id, full_name, username, avatar_url)
            `)
            .ilike('content', searchTerm)
            .order('created_at', { ascending: false })
            .limit(20),
          supabaseAdmin
            .from('communities')
            .select(`
              *,
              creator:profiles(id, full_name, username, avatar_url),
              members:community_members(count)
            `)
            .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},username.ilike.${searchTerm}`)
            .order('created_at', { ascending: false })
            .limit(20),
        ]);

        return NextResponse.json({ 
          users: users || [], 
          posts: postsRes.data || [],
          communities: communitiesRes.data || []
        });
      }
    }

    if (type === 'posts') {
      const { data: posts, error: postsError } = await supabaseAdmin
        .from('posts')
        .select(`
          id,
          content,
          media_url,
          media_type,
          created_at,
          user:profiles(id, full_name, username, avatar_url)
        `)
        .ilike('content', searchTerm)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      return NextResponse.json({ posts: posts || [] });
    }

    if (type === 'communities') {
      const { data: communities, error: communitiesError } = await supabaseAdmin
        .from('communities')
        .select(`
          *,
          creator:profiles(id, full_name, username, avatar_url),
          members:community_members(count)
        `)
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},username.ilike.${searchTerm}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (communitiesError) throw communitiesError;

      return NextResponse.json({ communities: communities || [] });
    }

    if (type === 'stories') {
      const { data: stories } = await supabaseAdmin
        .from('stories')
        .select(`id, caption, photo_url, created_at, user:profiles(id, full_name, username, avatar_url)`)
        .ilike('caption', searchTerm)
        .order('created_at', { ascending: false })
        .limit(20);
      return NextResponse.json({ stories: stories || [] });
    }

    return NextResponse.json({ users: [], posts: [], communities: [] });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
