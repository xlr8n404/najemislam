import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Called once on app init to ensure required storage buckets exist
export async function GET() {
  return POST();
}

export async function POST() {
  try {
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    if (listError) throw listError;

    const exists = buckets?.some((b) => b.name === 'stories');

    if (exists) {
      return NextResponse.json({ ok: true, message: 'stories bucket already exists' });
    }

    const { error } = await supabaseAdmin.storage.createBucket('stories', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 10485760, // 10 MB
    });

    if (error) throw error;

    return NextResponse.json({ ok: true, message: 'stories bucket created' });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
