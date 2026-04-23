import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[v0] Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
  try {
    console.log('[v0] Starting migration: username → sharable_id');
    
    // Step 1: Check current schema
    console.log('[v0] Checking current schema...');
    const { data: schemaInfo, error: schemaError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('[v0] Error checking schema:', schemaError);
      process.exit(1);
    }

    console.log('[v0] Current schema columns:', Object.keys(schemaInfo[0] || {}));

    // Step 2: Run the migration SQL
    console.log('[v0] Running migration SQL...');
    
    const migrationSQL = `
      -- Check if username column exists and rename it to sharable_id
      DO $$ 
      BEGIN
        -- If username column exists, rename it
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='profiles' AND column_name='username'
        ) THEN
          ALTER TABLE profiles RENAME COLUMN username TO sharable_id;
          ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_key;
          ALTER TABLE profiles ADD CONSTRAINT profiles_sharable_id_key UNIQUE (sharable_id);
          DROP INDEX IF EXISTS profiles_username_idx;
          CREATE INDEX profiles_sharable_id_idx ON profiles(sharable_id);
          RAISE NOTICE 'Renamed username to sharable_id in profiles table';
        ELSE
          RAISE NOTICE 'username column not found in profiles table';
        END IF;
      END $$;
    `;

    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    }).catch(() => {
      // If RPC doesn't work, try raw query
      return supabase.rpc('sql', { statement: migrationSQL });
    });

    if (migrationError && migrationError.code !== 'PGRST204') {
      console.log('[v0] Note: RPC exec might not be available, attempting direct approach...');
    }

    // Step 3: Verify migration
    console.log('[v0] Verifying migration...');
    const { data: newSchemaData, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.error('[v0] Error verifying schema:', verifyError);
      process.exit(1);
    }

    const newColumns = Object.keys(newSchemaData[0] || {});
    console.log('[v0] New schema columns:', newColumns);

    if (newColumns.includes('sharable_id')) {
      console.log('[v0] ✅ Migration successful! Column renamed to sharable_id');
    } else if (newColumns.includes('username')) {
      console.log('[v0] ⚠️ username column still exists. Manual migration may be needed.');
    }

  } catch (error) {
    console.error('[v0] Migration error:', error);
    process.exit(1);
  }
}

migrate();
