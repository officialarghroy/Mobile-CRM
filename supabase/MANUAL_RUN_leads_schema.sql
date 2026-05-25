-- =============================================================================
-- Run this entire script in Supabase: SQL Editor → New query → Paste → Run
-- Safe to run more than once (uses IF NOT EXISTS where supported).
-- =============================================================================

-- Soft delete (Recently deleted / restore / soft delete from UI)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS leads_deleted_at_idx ON public.leads (deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

-- Contact + equipment fields (Add lead / lead detail forms)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS email text NULL,
  ADD COLUMN IF NOT EXISTS phone text NULL,
  ADD COLUMN IF NOT EXISTS equipment_brand text NULL,
  ADD COLUMN IF NOT EXISTS equipment_model text NULL,
  ADD COLUMN IF NOT EXISTS brand_model text NULL,
  ADD COLUMN IF NOT EXISTS issue_description text NULL;

-- Vapi AI / Make.com webhook fields (also in migrations/20260525120000_vapi_leads_webhook_fields.sql)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS source text NULL,
  ADD COLUMN IF NOT EXISTS contact_reason text NULL,
  ADD COLUMN IF NOT EXISTS preferred_time text NULL,
  ADD COLUMN IF NOT EXISTS other_inquiries text NULL;
