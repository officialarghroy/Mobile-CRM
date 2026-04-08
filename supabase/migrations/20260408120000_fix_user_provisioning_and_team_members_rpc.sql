-- New users were sometimes provisioned to the wrong team: handle_new_user_team used a
-- case-sensitive UUID regex, so uppercase IDs in raw_app_meta_data skipped the branch that
-- uses provision_team_id. get_team_members marked STABLE can also encourage over-caching.

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
    au.email::text,
    COALESCE(NULLIF(trim(up.display_name), ''), split_part(au.email::text, '@', 1), '—'),
    tm.role::text,
    tm.created_at
  FROM public.team_members tm
  JOIN auth.users au ON au.id = tm.user_id
  LEFT JOIN public.user_profiles up ON up.user_id = tm.user_id
  WHERE tm.team_id = public.get_my_team_id ()
  ORDER BY tm.user_id, tm.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_members () TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user_team ()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid;
  r text;
  prov_team text;
BEGIN
  prov_team := NEW.raw_app_meta_data ->> 'provision_team_id';
  r := lower(COALESCE(NEW.raw_app_meta_data ->> 'provision_role', ''));

  IF
    prov_team IS NOT NULL
    AND prov_team ~* '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    AND EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE
        t.id = prov_team::uuid
    )
    AND r IN ('admin', 'developer', 'content_writer')
  THEN
    INSERT INTO public.team_members(team_id, user_id, role)
    VALUES (prov_team::uuid, NEW.id, r::public.team_role)
    ON CONFLICT (team_id, user_id) DO UPDATE
    SET role = EXCLUDED.role;
  ELSE
    SELECT t.id INTO tid
    FROM public.teams t
    ORDER BY t.created_at ASC
    LIMIT 1;
    IF tid IS NULL THEN
      INSERT INTO public.teams (name)
      VALUES ('My Team')
      RETURNING id INTO tid;
      INSERT INTO public.team_members(team_id, user_id, role)
      VALUES (tid, NEW.id, 'admin');
    ELSE
      INSERT INTO public.team_members(team_id, user_id, role)
      VALUES (tid, NEW.id, 'developer');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
