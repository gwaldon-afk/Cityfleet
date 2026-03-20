-- ═══════════════════════════════════════════════════════════════════════════
-- City Fleet — Reset demo data (for clean walkthrough)
-- Run in Supabase SQL Editor, then run seed.sql (+ seed_phase_b.sql if used).
-- Tester guide: docs/CLIENT-TEST-MANUAL.md | Accounts: docs/SEED-DATA.md
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Clear shifts so no mechanics are clocked on
DELETE FROM public.shifts;

-- 2. Clear job-related data (child tables first)
DELETE FROM public.job_notes;
DELETE FROM public.job_safety_checklists;
DELETE FROM public.defects;
DELETE FROM public.supplier_invoices;  -- references job_parts
DELETE FROM public.job_parts;
DELETE FROM public.time_entries;
DELETE FROM public.invoices;
DELETE FROM public.job_attachments;
DELETE FROM public.purchase_orders;
DELETE FROM public.jobs;

-- Done. Next: run seed.sql then seed_phase_b.sql in SQL Editor.
-- Log in with manager@cityfleet.local / Password1! for the demo.
