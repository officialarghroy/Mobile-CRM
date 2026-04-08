-- Allow team events to be assigned to another teammate (owner_user_id = assignee).
-- Track creator with created_by_user_id; optional lead_id for lead-linked tasks.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS events_created_by_user_id_idx ON public.events (created_by_user_id);
CREATE INDEX IF NOT EXISTS events_lead_id_idx ON public.events (lead_id);

UPDATE public.events e
SET created_by_user_id = u.id
FROM auth.users u
WHERE
  e.created_by_user_id IS NULL
  AND e.user_name IS NOT NULL
  AND trim(e.user_name) <> ''
  AND lower(trim(e.user_name)) = lower(trim(u.email));

-- RLS: INSERT team row when assignee shares a team with the creator (or self / unassigned).
CREATE OR REPLACE FUNCTION public.team_users_share_a_team (a uuid, b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm1
    INNER JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = a
      AND tm2.user_id = b
  );
$$;

REVOKE ALL ON FUNCTION public.team_users_share_a_team (uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.team_users_share_a_team (uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS events_insert_scoped ON public.events;

CREATE POLICY events_insert_scoped ON public.events FOR INSERT TO authenticated WITH CHECK (
  (
    calendar_scope = 'team'
    AND (
      owner_user_id IS NULL
      OR owner_user_id = auth.uid ()
      OR public.team_users_share_a_team (auth.uid (), owner_user_id)
    )
  )
  OR (calendar_scope = 'personal' AND owner_user_id = auth.uid ())
);
