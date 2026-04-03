-- Soft-delete support for leads (Recently deleted / restore / permanent delete in app).
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS leads_deleted_at_idx ON public.leads (deleted_at DESC)
  WHERE deleted_at IS NOT NULL;
