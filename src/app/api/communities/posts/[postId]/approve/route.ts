import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    const { admin_id } = await req.json();

    if (!admin_id) {
      return NextResponse.json({ error: 'Missing admin_id' }, { status: 400 });
    }

    // Get the post
    const { data: post } = await supabaseAdmin
      .from('community_posts')
      .select('community_id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user is admin
    const { data: admin } = await supabaseAdmin
      .from('community_members')
      .select('role')
      .eq('community_id', post.community_id)
      .eq('user_id', admin_id)
      .single();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('community_posts')
      .update({
        is_approved: true,
        approved_by: admin_id,
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
