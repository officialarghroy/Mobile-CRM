-- Run in Supabase SQL Editor if you do not apply migrations via CLI.
-- Ensures calendar events exist and any signed-in user can create, read, update, and delete events.

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  start_time timestamptz,
  end_time timestamptz,
  user_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_start_time_idx ON public.events (start_time);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_select_authenticated ON public.events;
DROP POLICY IF EXISTS events_insert_authenticated ON public.events;
DROP POLICY IF EXISTS events_update_authenticated ON public.events;
DROP POLICY IF EXISTS events_delete_authenticated ON public.events;
DROP POLICY IF EXISTS events_delete_own ON public.events;
DROP POLICY IF EXISTS events_select_own ON public.events;

CREATE POLICY events_select_authenticated ON public.events FOR SELECT TO authenticated USING (true);

CREATE POLICY events_insert_authenticated ON public.events FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY events_update_authenticated ON public.events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY events_delete_authenticated ON public.events FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
