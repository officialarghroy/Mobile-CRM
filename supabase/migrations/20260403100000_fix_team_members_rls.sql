-- If you already ran the older migration with self-referential team_members RLS,
-- run this in the SQL Editor to fix "permission denied" / empty team lists / false non-admin.

DROP POLICY IF EXISTS teams_select_member ON public.teams;
DROP POLICY IF EXISTS team_members_select_same_team ON public.team_members;
DROP POLICY IF EXISTS user_profiles_select_team ON public.user_profiles;

CREATE OR REPLACE FUNCTION public.get_my_team_id ()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id
  FROM public.team_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_team_id () TO authenticated;

CREATE POLICY teams_select_member ON public.teams FOR SELECT TO authenticated USING (id = (SELECT public.get_my_team_id ()));

CREATE POLICY team_members_select_same_team ON public.team_members FOR SELECT TO authenticated USING (
  team_id = (SELECT public.get_my_team_id ())
);

CREATE POLICY user_profiles_select_team ON public.user_profiles FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE
      tm.user_id = user_profiles.user_id
      AND tm.team_id = (SELECT public.get_my_team_id ())
  )
);

DROP TRIGGER IF EXISTS on_auth_user_created_team ON auth.users;

CREATE TRIGGER on_auth_user_created_team
AFTER INSERT ON auth.users FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user_team ();
