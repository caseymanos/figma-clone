# Fix: Object Sync Issue (Objects Only Update on Refresh)

## Problem
Objects created or moved by one user don't appear in real-time for other users. They only show up after refreshing the page.

## Root Cause
The `objects` table is not included in Supabase's Realtime publication, so database changes aren't being broadcast to connected clients.

## Solution

### Step 1: Enable Realtime for Objects Table

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Run this SQL command:

```sql
-- Enable Realtime replication for the objects table
alter publication supabase_realtime add table public.objects;
```

5. Click "Run" or press `Ctrl/Cmd + Enter`

### Step 2: Verify it Worked

Run this query to confirm the objects table is in the publication:

```sql
select * from pg_publication_tables where pubname = 'supabase_realtime';
```

You should see `objects` in the list of tables.

### Step 3: Test

1. Deploy the updated code to Vercel (or restart your local dev server)
2. Open the canvas in two different browser windows (or use incognito mode)
3. Sign in as different users in each window
4. Open the same canvas in both windows
5. Move or create an object in one window
6. **It should immediately appear in the other window** without refresh

## Alternative: Use Supabase Dashboard UI

If you prefer using the UI instead of SQL:

1. Go to **Database** → **Replication** in the Supabase Dashboard
2. Find the `supabase_realtime` publication
3. Click to edit it
4. Add the `objects` table to the publication
5. Save changes

## Why This Happened

The schema file includes the table definitions and triggers, but Supabase Realtime requires tables to be explicitly added to the `supabase_realtime` publication. This is a separate configuration step that wasn't included in the initial schema migration.

## Files Updated

- `supabase/schema.sql` - Added the publication command for future deployments
- `supabase/enable-realtime.sql` - Created standalone migration file
- Build errors fixed (TypeScript issues with `JSX.Element` and UserAvatar props)

