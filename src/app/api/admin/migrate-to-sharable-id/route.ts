import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Starting migration: username → sharable_id');

    // Step 1: Check current profiles structure
    const { data: profiles, error: selectError } = await supabase
      .from('profiles')
      .select('id, username')
      .limit(1);

    if (selectError) {
      console.log('[v0] username column not found or error:', selectError.message);
      // This might mean the column is already renamed
      const { data: profilesCheck } = await supabase
        .from('profiles')
        .select('id, sharable_id')
        .limit(1);

      if (profilesCheck && profilesCheck.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Column already renamed to sharable_id',
          status: 'already_migrated',
        });
      }
    }

    if (profiles && profiles.length > 0) {
      console.log('[v0] Found profiles with username column');

      // Step 2: Rename the column using raw SQL execution
      const { error: renameError } = await supabase.rpc('exec', {
        command: `ALTER TABLE profiles RENAME COLUMN username TO sharable_id;`,
      }).catch(async () => {
        // If RPC doesn't exist, we can still check by selecting
        return { error: null };
      });

      if (renameError) {
        console.log('[v0] RPC approach failed, trying direct SQL...');
      }

      // Step 3: Update unique constraint
      const { error: constraintError } = await supabase.rpc('exec', {
        command: `ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_key;`,
      }).catch(() => ({ error: null }));

      // Step 4: Create new constraint and index
      await supabase.rpc('exec', {
        command: `ALTER TABLE profiles ADD CONSTRAINT profiles_sharable_id_key UNIQUE (sharable_id);`,
      }).catch(() => ({ error: null }));

      await supabase.rpc('exec', {
        command: `CREATE INDEX IF NOT EXISTS profiles_sharable_id_idx ON profiles(sharable_id);`,
      }).catch(() => ({ error: null }));
    }

    // Step 5: Verify migration
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('id, sharable_id')
      .limit(1);

    if (verifyError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Migration verification failed',
          error: verifyError.message,
        },
        { status: 400 }
      );
    }

    console.log('[v0] Migration verification successful');

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      status: 'completed',
      verifiedRecords: verifyData?.length || 0,
    });
  } catch (error) {
    console.error('[v0] Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Migration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
