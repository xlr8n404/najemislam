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

// Save a push subscription for the authenticated user
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subscription } = await req.json();
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Upsert by endpoint so re-subscribing doesn't create duplicates
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          subscription: JSON.stringify(subscription),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('push-subscribe POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Remove a push subscription
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });

    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
