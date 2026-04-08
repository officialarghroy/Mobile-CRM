-- Task / event completion (assignee or any updater per existing events UPDATE policies).

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS completed_at timestamptz NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS completed_by_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS events_owner_open_task_idx ON public.events (owner_user_id)
  WHERE completed_at IS NULL;
