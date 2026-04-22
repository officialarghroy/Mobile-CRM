-- Treat legacy "paid" as completed (Completed tab + Paid action persist completed).
UPDATE public.leads
SET
  status = 'completed'
WHERE
  lower(trim(coalesce(status, ''))) = 'paid';
