-- Many CRM schemas only allowed paid/not_paid/etc. and rejected `completed`, which broke the Paid control.
-- Replace a common template constraint name with one that allows both paid and completed.

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_values_chk;

ALTER TABLE public.leads
ADD CONSTRAINT leads_status_values_chk CHECK (
  status IS NULL
  OR trim(lower(status::text)) IN (
    'pending',
    'urgent',
    'paid',
    'not_paid',
    'completed'
  )
);
