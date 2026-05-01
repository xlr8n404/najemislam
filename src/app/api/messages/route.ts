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

export async function GET(req: NextRequest) {
  try {
    const authUserId = await getAuthUserId(req);
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversation_id = searchParams.get('conversation_id');

    if (!conversation_id) {
      return NextResponse.json({ error: 'Missing conversation_id' }, { status: 400 });
    }

    // Verify the authenticated user is a participant in this conversation
    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversation_id)
      .single();

    if (!conv || (conv.user1_id !== authUserId && conv.user2_id !== authUserId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, username, avatar_url)
      `)
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUserId = await getAuthUserId(req);
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversation_id, sender_id, content } = await req.json();

    // Enforce that caller can only send as themselves
    if (sender_id !== authUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!conversation_id || !sender_id || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({ conversation_id, sender_id, content })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, username, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Background sync to Google Drive
    try {
      // We don't wait for this to finish to avoid delaying message delivery
      const driveMetadata = {
        message_id: data.id,
        conversation_id,
        sender_id,
        content,
        created_at: data.created_at
      };
      
      const driveFormData = new FormData();
      driveFormData.append('type', 'messages');
      driveFormData.append('metadata', JSON.stringify(driveMetadata));
      
      // We need the app URL to call our own API or we can just call the lib directly if we have the userId
      // Since we are in an API route, we can call the lib directly if we have a way to get the refresh token.
      // But it's easier to just call the API we already made.
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      fetch(`${appUrl}/api/drive/sync`, {
        method: 'POST',
        headers: {
          'Cookie': req.headers.get('cookie') || ''
        },
        body: driveFormData
      }).catch(err => console.error('Background drive sync failed:', err));
    } catch (syncErr) {
      console.error('Drive sync trigger error:', syncErr);
    }

    await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation_id);

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
