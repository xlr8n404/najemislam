import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        last_seen: new Date().toISOString(),
        status: 'online'
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating presence:', error);
      return NextResponse.json({ error: 'Failed to update presence' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
