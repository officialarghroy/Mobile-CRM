-- Indexes for Team Updates page queries (team events by completion / schedule).

CREATE INDEX IF NOT EXISTS events_team_completed_at_idx ON public.events (completed_at DESC NULLS LAST)
WHERE calendar_scope = 'team' AND completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS events_team_open_start_time_idx ON public.events (start_time ASC NULLS LAST)
WHERE calendar_scope = 'team' AND completed_at IS NULL;
