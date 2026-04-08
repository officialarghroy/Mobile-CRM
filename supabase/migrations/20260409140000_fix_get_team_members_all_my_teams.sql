-- List everyone who shares ANY team with the viewer, not only get_my_team_id().
-- When a user has several team_members rows, "=" get_my_team_id() can hide people who were
-- added under another of the viewer's teams. Use LEFT JOIN auth.users so a row still appears
-- if the email join is missing.

CREATE OR REPLACE FUNCTION public.get_team_members ()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  role text,
  member_since timestamptz
)
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (tm.user_id)
    tm.user_id,
    COALESCE(au.email::text, ''),
    COALESCE(
      NULLIF(trim(up.display_name), ''),
      NULLIF(split_part(COALESCE(au.email::text, ''), '@', 1), ''),
      '—'
    ),
    tm.role::text,
    tm.created_at
  FROM public.team_members tm
  LEFT JOIN auth.users au ON au.id = tm.user_id
  LEFT JOIN public.user_profiles up ON up.user_id = tm.user_id
  WHERE tm.team_id IN (
    SELECT tmx.team_id
    FROM public.team_members tmx
    WHERE tmx.user_id = auth.uid()
  )
  ORDER BY tm.user_id, tm.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_members () TO authenticated;
