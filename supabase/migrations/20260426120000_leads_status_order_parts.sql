-- Adds pipeline statuses for parts workflow. Run this in Supabase SQL Editor if you apply migrations manually.

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
    'parts_ordered'
  )
);
