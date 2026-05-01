import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('communities')
      .select(`
        *,
        creator:profiles(id, full_name, username, avatar_url),
        members:community_members(id, user_id, role, user:profiles(id, full_name, username, avatar_url))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

    return NextResponse.json({ community: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, description, category, avatar_url, creator_id } = await req.json();

    // Verify user is creator
    const { data: community } = await supabaseAdmin
      .from('communities')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!community || community.creator_id !== creator_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('communities')
      .update({ name, description, category, avatar_url })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { creator_id } = await req.json();

    // Verify user is creator
    const { data: community } = await supabaseAdmin
      .from('communities')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!community || community.creator_id !== creator_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('communities')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
