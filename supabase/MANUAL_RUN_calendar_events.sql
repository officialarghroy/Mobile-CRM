-- Run in Supabase SQL Editor if you do not apply migrations via CLI.
-- Calendar events: team (shared) and personal (owner-only), with RLS.

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  start_time timestamptz,
  end_time timestamptz,
  user_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS calendar_scope text NOT NULL DEFAULT 'team',
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads (id) ON DELETE SET NULL;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_calendar_scope_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_calendar_scope_check CHECK (calendar_scope IN ('team', 'personal'));

UPDATE public.events SET calendar_scope = 'team' WHERE calendar_scope IS NULL;

CREATE INDEX IF NOT EXISTS events_start_time_idx ON public.events (start_time);
CREATE INDEX IF NOT EXISTS events_calendar_scope_idx ON public.events (calendar_scope);
CREATE INDEX IF NOT EXISTS events_owner_user_id_idx ON public.events (owner_user_id);
CREATE INDEX IF NOT EXISTS events_created_by_user_id_idx ON public.events (created_by_user_id);
CREATE INDEX IF NOT EXISTS events_lead_id_idx ON public.events (lead_id);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS completed_at timestamptz NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS completed_by_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS events_owner_open_task_idx ON public.events (owner_user_id)
  WHERE completed_at IS NULL;

UPDATE public.events e
SET created_by_user_id = u.id
FROM auth.users u
WHERE
  e.created_by_user_id IS NULL
  AND e.user_name IS NOT NULL
  AND trim(e.user_name) <> ''
  AND lower(trim(e.user_name)) = lower(trim(u.email));

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

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_select_authenticated ON public.events;
DROP POLICY IF EXISTS events_insert_authenticated ON public.events;
DROP POLICY IF EXISTS events_update_authenticated ON public.events;
DROP POLICY IF EXISTS events_delete_authenticated ON public.events;
DROP POLICY IF EXISTS events_delete_own ON public.events;
DROP POLICY IF EXISTS events_select_own ON public.events;

DROP POLICY IF EXISTS events_select_visible ON public.events;
DROP POLICY IF EXISTS events_insert_scoped ON public.events;
DROP POLICY IF EXISTS events_update_team ON public.events;
DROP POLICY IF EXISTS events_update_personal_own ON public.events;
DROP POLICY IF EXISTS events_delete_team ON public.events;
DROP POLICY IF EXISTS events_delete_personal_own ON public.events;

CREATE POLICY events_select_visible ON public.events FOR SELECT TO authenticated USING (
  calendar_scope = 'team'
  OR (calendar_scope = 'personal' AND owner_user_id = auth.uid())
);

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

CREATE POLICY events_update_team ON public.events FOR UPDATE TO authenticated USING (calendar_scope = 'team') WITH CHECK (calendar_scope = 'team');

CREATE POLICY events_update_personal_own ON public.events FOR UPDATE TO authenticated USING (
  calendar_scope = 'personal'
  AND owner_user_id = auth.uid()
) WITH CHECK (calendar_scope = 'personal' AND owner_user_id = auth.uid());

CREATE POLICY events_delete_team ON public.events FOR DELETE TO authenticated USING (calendar_scope = 'team');

CREATE POLICY events_delete_personal_own ON public.events FOR DELETE TO authenticated USING (
  calendar_scope = 'personal'
  AND owner_user_id = auth.uid()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
