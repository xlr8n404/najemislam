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
    const { name, description, category, avatar_url, cover_url, posting_permission, creator_id, transfer_to } = await req.json();

    // Verify user is creator
    const { data: community } = await supabaseAdmin
      .from('communities')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!community || community.creator_id !== creator_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Handle ownership transfer
    if (transfer_to) {
      const { data: newOwner, error: userErr } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', transfer_to)
        .maybeSingle();
      if (userErr || !newOwner) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const { error: transferErr } = await supabaseAdmin
        .from('communities')
        .update({ creator_id: newOwner.id })
        .eq('id', id);
      if (transferErr) throw transferErr;
      // Ensure new owner is an admin member
      await supabaseAdmin.from('community_members').upsert(
        { community_id: id, user_id: newOwner.id, role: 'admin' },
        { onConflict: 'community_id,user_id' }
      );
      return NextResponse.json({ success: true, transferred: true });
    }

    const updatePayload: Record<string, any> = { name, description, category };
    if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url;
    if (cover_url !== undefined) updatePayload.cover_url = cover_url;
    if (posting_permission !== undefined) updatePayload.posting_permission = posting_permission;

    const { data, error } = await supabaseAdmin
      .from('communities')
      .update(updatePayload)
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
