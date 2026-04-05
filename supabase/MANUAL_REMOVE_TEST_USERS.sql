-- Run once in the Supabase SQL Editor to delete Auth users whose visible name is
-- "Test User", "Test User 2", or "testuser2" (case-insensitive, trimmed; spaces normalized).
-- team_members and user_profiles rows cascade from auth.users.

DELETE FROM auth.users
WHERE
  id IN (
    SELECT u.id
    FROM auth.users u
    LEFT JOIN public.user_profiles up ON up.user_id = u.id
    WHERE
      regexp_replace(
        lower(
          trim(
            COALESCE(
              NULLIF(trim(up.display_name), ''),
              trim(COALESCE(u.raw_user_meta_data ->> 'name', '')),
              split_part(u.email::text, '@', 1)
            )
          )
        ),
        '\s+',
        ' ',
        'g'
      ) IN ('test user', 'test user 2', 'testuser2')
  );
