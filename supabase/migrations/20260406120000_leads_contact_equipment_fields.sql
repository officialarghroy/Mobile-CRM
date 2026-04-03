-- Extra lead fields (contact + equipment) used by Add lead and lead detail.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS email text NULL,
  ADD COLUMN IF NOT EXISTS phone text NULL,
  ADD COLUMN IF NOT EXISTS equipment_brand text NULL,
  ADD COLUMN IF NOT EXISTS equipment_model text NULL,
  ADD COLUMN IF NOT EXISTS brand_model text NULL,
  ADD COLUMN IF NOT EXISTS issue_description text NULL;
