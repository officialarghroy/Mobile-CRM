-- In-app notifications (e.g. task assigned to a teammate).

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  message text NOT NULL,
  type text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_created_at_idx ON public.notifications (
  user_id,
  created_at DESC
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_teammate ON public.notifications;

CREATE POLICY notifications_select_own ON public.notifications FOR SELECT TO authenticated USING (
  user_id = auth.uid ()
);

CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated USING (
  user_id = auth.uid ()
) WITH CHECK (
  user_id = auth.uid ()
);

-- Creator may notify a teammate (same rule as assigning a team task).
CREATE POLICY notifications_insert_teammate ON public.notifications FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid ()
  OR public.team_users_share_a_team (auth.uid (), user_id)
);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
