-- Link notifications to domain entities (e.g. calendar event for task assignment).

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS entity_id uuid REFERENCES public.events (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS entity_type text;

CREATE INDEX IF NOT EXISTS notifications_entity_idx ON public.notifications (entity_type, entity_id)
WHERE
  entity_id IS NOT NULL;
