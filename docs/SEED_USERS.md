# Users and teams

## Database

1. In the Supabase **SQL Editor**, run **`supabase/migrations/20260402100000_teams_members_profiles.sql`**.  
   This creates `teams`, `team_members`, `user_profiles`, the new-user trigger, and `get_team_members` / `get_my_team_id`.

2. If you already ran an **older** version of that file and see permission errors or everyone looks non-admin, run **`supabase/migrations/20260403100000_fix_team_members_rls.sql`** (fixes recursive RLS on `team_members`).

3. Set **`SUPABASE_SERVICE_ROLE_KEY`** in `.env.local` so team admins can create users from the app.

## Who can create users

Only **`team_members.role = admin`** sees **Users** in the menu and can use **Create user**. There is no email allowlist.

## Adding people

- **In the app:** sign in as a team admin → **Users** → **Create user** (email, password, role, optional display name).  
- **Supabase Dashboard:** Authentication → Add user (they still need a `team_members` row; the migration backfill gives existing users a team; new Dashboard-only users get the trigger behavior on insert).  
- **Script:** `npm run seed:user` with `SEED_EMAIL` / `SEED_PASSWORD` (see `scripts/seed-auth-user.mjs`).

Suggested first accounts (names via Display name or user metadata `name`):

| Display name  | Email                     |
|---------------|---------------------------|
| Arghoy        | officialarghroy@gmail.com |
| Michael Huynh | michaeldanhuynh@gmail.com |
| Michal Hajtas | info@redditera.com        |

Everyone signs in with **email and password**. There is no public signup page.
