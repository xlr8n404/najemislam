# Username to Sharable ID Migration Guide

## Overview

This guide explains how to migrate your database from using `username` to `sharable_id` to align with your Sharable app's branding.

## What Changed

- **Column Name**: `username` → `sharable_id`
- **Database Schema**: Updated in `scripts/00-profiles.sql`
- **Auth System**: All API routes now use `sharable_id` (already updated)
- **Migration Script**: `scripts/05-rename-username-to-sharable-id.sql` handles the migration

## Migration Steps

### Option 1: Using the Admin Migration Page (Easiest)

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Visit the admin migration page:
   ```
   http://localhost:3000/admin/migrate
   ```

3. Click "Start Migration" button

4. The page will show the migration status

### Option 2: Manual SQL Execution

If you have direct database access with `psql`:

```bash
# Set environment variables
export POSTGRES_URL="your-postgres-url"

# Run the migration script
psql "$POSTGRES_URL" -f scripts/05-rename-username-to-sharable-id.sql
```

### Option 3: Using Node.js Script

```bash
# Run the migration script
node --env-file-if-exists=/vercel/share/.env.project scripts/migrate-username-to-sharable-id.js
```

## Verification

After migration, your users should be able to:

1. **Login** with their sharable ID and password
2. **Register** a new account with a sharable ID
3. **Check availability** of sharable IDs

Test by:

```bash
# Login with your sharable ID
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_sharable_id",
    "password": "your_password"
  }'
```

## Database Changes

### Before Migration
- `profiles` table had `username` column
- Unique constraint: `profiles_username_key`
- Index: `profiles_username_idx`

### After Migration
- `profiles` table has `sharable_id` column
- Unique constraint: `profiles_sharable_id_key`
- Index: `profiles_sharable_id_idx`

## Troubleshooting

### Error: "Column 'sharable_id' does not exist"

This means the migration hasn't run yet. Use Option 1 (admin page) to run it.

### Error: "Duplicate key value violates unique constraint"

Check if your database has conflicting data. The migration script handles this, but verify:

```sql
SELECT sharable_id, COUNT(*) 
FROM profiles 
GROUP BY sharable_id 
HAVING COUNT(*) > 1;
```

### Old logins still not working

1. Verify the migration completed successfully
2. Check that the database has `sharable_id` column (not `username`)
3. Clear browser cookies and try again

## Rollback (If Needed)

If you need to rollback, keep the backup of your original database or:

```sql
-- Only if migration hasn't been applied
ALTER TABLE profiles RENAME COLUMN sharable_id TO username;
```

## Files Modified

- `scripts/00-profiles.sql` - Updated schema to use `sharable_id`
- `scripts/05-rename-username-to-sharable-id.sql` - Migration script
- `scripts/migrate-username-to-sharable-id.js` - Node.js migration helper
- `src/app/admin/migrate/page.tsx` - Admin UI for running migration
- `src/app/api/admin/migrate-to-sharable-id/route.ts` - API endpoint for migration

## Notes

- The auth system (login, register, check-username) was already updated to use `sharable_id`
- All error messages now reference "Sharable ID" instead of "username"
- The `username` field in JWT tokens still uses the key "username" for backward compatibility
