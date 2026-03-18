import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('communities')
      .select(`
        *,
        creator:profiles(id, full_name, username, avatar_url),
        members:community_members(count)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ communities: data || [], total: count || 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, category, avatar_url, creator_id, is_private } = await req.json();

    if (!name || !creator_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('communities')
      .insert({
        name,
        description,
        category,
        avatar_url,
        creator_id,
        is_private,
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as admin member
    await supabaseAdmin
      .from('community_members')
      .insert({
        community_id: data.id,
        user_id: creator_id,
        role: 'admin',
      });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
