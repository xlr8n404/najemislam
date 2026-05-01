import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('sb-auth-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const payload = await verifyToken(sessionToken);
    if (!payload || !payload.userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Return mocked user object to maintain compatibility
    const response = NextResponse.json({
      user: {
        id: profile.id,
        email: `${profile.username}@shareit.com`,
        user_metadata: {
          username: profile.username,
          full_name: profile.full_name
        },
        profile
      }
    });
    // Cache session response for 60s — avoids DB hit on every page render
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=30');
    return response;
  } catch (error: any) {
    return NextResponse.json({ user: null, error: error.message }, { status: 500 });
  }
}
