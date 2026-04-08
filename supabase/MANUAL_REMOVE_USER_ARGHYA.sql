-- Run in Supabase SQL Editor (service role / dashboard). Review the preview SELECT first.
-- Deletes auth user(s) whose email, profile display name, or signup name contains "arghya" (case-insensitive).
-- team_members + user_profiles cascade. events.owner_user_id / created_by_user_id / completed_by_user_id SET NULL.
-- lead_updates.created_by is plain text; old notes may still show that email string unless you update separately.

-- Preview (run alone first):
-- SELECT u.id, u.email, up.display_name, u.raw_user_meta_data ->> 'name' AS meta_name
-- FROM auth.users u
-- LEFT JOIN public.user_profiles up ON up.user_id = u.id
-- WHERE
--   u.email ILIKE '%arghya%'
--   OR regexp_replace(lower(trim(COALESCE(up.display_name, ''))), '\s+', ' ', 'g') LIKE '%arghya%'
--   OR regexp_replace(lower(trim(COALESCE(u.raw_user_meta_data ->> 'name', ''))), '\s+', ' ', 'g') LIKE '%arghya%';

DELETE FROM auth.users
WHERE
  id IN (
    SELECT u.id
    FROM auth.users u
    LEFT JOIN public.user_profiles up ON up.user_id = u.id
    WHERE
      u.email ILIKE '%arghya%'
      OR regexp_replace(lower(trim(COALESCE(up.display_name, ''))), '\s+', ' ', 'g') LIKE '%arghya%'
      OR regexp_replace(lower(trim(COALESCE(u.raw_user_meta_data ->> 'name', ''))), '\s+', ' ', 'g') LIKE '%arghya%'
  );
