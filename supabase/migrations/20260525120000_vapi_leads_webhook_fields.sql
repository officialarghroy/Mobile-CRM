-- Vapi AI / Make.com webhook: source, contact metadata, and "new" pipeline status.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS source text NULL,
  ADD COLUMN IF NOT EXISTS contact_reason text NULL,
  ADD COLUMN IF NOT EXISTS preferred_time text NULL,
  ADD COLUMN IF NOT EXISTS other_inquiries text NULL;

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_values_chk;

ALTER TABLE public.leads
ADD CONSTRAINT leads_status_values_chk CHECK (
  status IS NULL
  OR trim(lower(status::text)) IN (
    'pending',
    'urgent',
    'paid',
    'not_paid',
    'completed',
    'order_parts',
    'parts_ordered',
    'new'
  )
);

CREATE INDEX IF NOT EXISTS leads_phone_created_at_active_idx
  ON public.leads (phone, created_at DESC)
  WHERE phone IS NOT NULL AND deleted_at IS NULL;
