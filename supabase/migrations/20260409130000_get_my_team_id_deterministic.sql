-- Pick a single team consistently: without ORDER BY, LIMIT 1 is arbitrary when a user has
-- more than one team_members row, so the Users list (get_team_members) and createUser
-- (provision_team_id) could disagree on which team is "yours".

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
  ORDER BY created_at ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_team_id () TO authenticated;
