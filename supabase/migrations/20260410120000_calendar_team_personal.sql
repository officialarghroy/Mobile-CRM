-- Team vs personal calendar: scope column, owner for RLS, and policies.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS calendar_scope text NOT NULL DEFAULT 'team',
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_calendar_scope_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_calendar_scope_check CHECK (calendar_scope IN ('team', 'personal'));

UPDATE public.events SET calendar_scope = 'team' WHERE calendar_scope IS NULL;

CREATE INDEX IF NOT EXISTS events_calendar_scope_idx ON public.events (calendar_scope);
CREATE INDEX IF NOT EXISTS events_owner_user_id_idx ON public.events (owner_user_id);

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

-- Team events: everyone signed in. Personal: only the owner.
CREATE POLICY events_select_visible ON public.events FOR SELECT TO authenticated USING (
  calendar_scope = 'team'
  OR (calendar_scope = 'personal' AND owner_user_id = auth.uid())
);

-- Team: scope team; optional owner must be self or null. Personal: must set owner to self.
CREATE POLICY events_insert_scoped ON public.events FOR INSERT TO authenticated WITH CHECK (
  (
    calendar_scope = 'team'
    AND (owner_user_id IS NULL OR owner_user_id = auth.uid())
  )
  OR (calendar_scope = 'personal' AND owner_user_id = auth.uid())
);

-- Team rows stay team (prevents retagging someone else's event as personal).
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
