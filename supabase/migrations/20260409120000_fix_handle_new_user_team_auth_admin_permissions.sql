-- Root cause of "Database error creating new user":
-- Inserts on auth.users fire triggers as role supabase_auth_admin, which cannot INSERT into
-- public.team_members. The trigger function must be SECURITY DEFINER and owned by a
-- privileged role (postgres) so inserts run with rights that bypass RLS on team_members.
-- Ref: https://supabase.com/docs/guides/troubleshooting/dashboard-errors-when-managing-users-N1ls4A

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
  /* Let SECURITY DEFINER inserts succeed when the function owner is subject to RLS. */
  PERFORM set_config('row_security', 'off', true);

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

ALTER FUNCTION public.handle_new_user_team () OWNER TO postgres;

DROP TRIGGER IF EXISTS on_auth_user_created_team ON auth.users;

CREATE TRIGGER on_auth_user_created_team
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user_team ();
