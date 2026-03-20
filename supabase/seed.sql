-- ═══════════════════════════════════════════════════════════════════════════
-- City Fleet — Seed data (Phase A)
-- Run after migrations. Creates: 1 site, 4 users (mechanic, WM, OPS, admin),
-- 2 customers, 2 vehicles, 2 jobs. All test users share password: Password1!
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Password for all seed users: Password1! (change in production!)
-- Must be hashed with crypt for auth.users
DO $$
DECLARE
  v_pw TEXT := crypt('Password1!', gen_salt('bf'));
  v_site_id UUID := 'a0000001-0000-4000-8000-000000000001';
  v_mechanic_id UUID := 'b0000001-0000-4000-8000-000000000001';
  v_manager_id UUID := 'b0000002-0000-4000-8000-000000000002';
  v_ops_id UUID := 'b0000003-0000-4000-8000-000000000003';
  v_admin_id UUID := 'b0000004-0000-4000-8000-000000000004';
BEGIN
  -- ═══ 1. Site ═══
  INSERT INTO public.sites (id, name, address_city, address_state, timezone, status)
  VALUES (v_site_id, 'City Fleet Sydney', 'Sydney', 'NSW', 'Australia/Sydney', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- ═══ 2. Auth users + identities + public.users + user_roles ═══
  -- Token columns must be '' not NULL or Auth returns 500 "Database error querying schema" (supabase/auth#1940).
  -- Mechanic
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (v_mechanic_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'mechanic@cityfleet.local', v_pw, NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Alex","last_name":"Mechanic"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (v_mechanic_id, v_mechanic_id, format('{"sub":"%s","email":"mechanic@cityfleet.local"}', v_mechanic_id)::jsonb, 'email', v_mechanic_id::text, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.users (id, first_name, last_name, email, status)
  VALUES (v_mechanic_id, 'Alex', 'Mechanic', 'mechanic@cityfleet.local', 'active')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role, site_id) VALUES (v_mechanic_id, 'mechanic', v_site_id)
  ON CONFLICT (user_id, role, site_id) DO NOTHING;

  -- Workshop Manager
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (v_manager_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'manager@cityfleet.local', v_pw, NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Sam","last_name":"Manager"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (v_manager_id, v_manager_id, format('{"sub":"%s","email":"manager@cityfleet.local"}', v_manager_id)::jsonb, 'email', v_manager_id::text, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.users (id, first_name, last_name, email, status)
  VALUES (v_manager_id, 'Sam', 'Manager', 'manager@cityfleet.local', 'active')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role, site_id) VALUES (v_manager_id, 'workshop_manager', v_site_id)
  ON CONFLICT (user_id, role, site_id) DO NOTHING;

  -- Ops Manager
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (v_ops_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'ops@cityfleet.local', v_pw, NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Jordan","last_name":"Ops"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (v_ops_id, v_ops_id, format('{"sub":"%s","email":"ops@cityfleet.local"}', v_ops_id)::jsonb, 'email', v_ops_id::text, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.users (id, first_name, last_name, email, status)
  VALUES (v_ops_id, 'Jordan', 'Ops', 'ops@cityfleet.local', 'active')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role, site_id) VALUES (v_ops_id, 'ops_manager', v_site_id)
  ON CONFLICT (user_id, role, site_id) DO NOTHING;

  -- Administrator
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'admin@cityfleet.local', v_pw, NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Admin","last_name":"User"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (v_admin_id, v_admin_id, format('{"sub":"%s","email":"admin@cityfleet.local"}', v_admin_id)::jsonb, 'email', v_admin_id::text, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.users (id, first_name, last_name, email, status)
  VALUES (v_admin_id, 'Admin', 'User', 'admin@cityfleet.local', 'active')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role, site_id) VALUES (v_admin_id, 'administrator', NULL)
  ON CONFLICT (user_id, role, site_id) DO NOTHING;

END $$;

-- Fix existing auth users that were inserted with NULL token columns (prevents 500 "Database error querying schema").
UPDATE auth.users
SET confirmation_token = COALESCE(confirmation_token, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    recovery_token = COALESCE(recovery_token, '')
WHERE confirmation_token IS NULL OR email_change IS NULL OR email_change_token_new IS NULL OR recovery_token IS NULL;

-- ═══ 3. Customers ═══
INSERT INTO public.customers (id, name, contact_name, contact_email, contact_phone, address_city, address_state, status)
VALUES
  ('c0000001-0000-4000-8000-000000000001', 'Acme Transport Co', 'Jane Smith', 'jane@acme.com', '02 9123 4567', 'Sydney', 'NSW', 'active'),
  ('c0000002-0000-4000-8000-000000000002', 'Metro Freight Pty Ltd', 'Bob Wilson', 'bob@metrofreight.com', '02 9876 5432', 'Sydney', 'NSW', 'active')
ON CONFLICT (id) DO NOTHING;

-- ═══ 4. Vehicles ═══
INSERT INTO public.vehicles (id, customer_id, registration_number, vin, make, model, year, status)
VALUES
  ('d0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 'ABC-123', '6T1BF3EK5CU123456', 'Volvo', 'FH16', 2022, 'active'),
  ('d0000002-0000-4000-8000-000000000002', 'c0000002-0000-4000-8000-000000000002', 'XYZ-789', '1HGBH41JXMN109186', 'Scania', 'R500', 2023, 'active')
ON CONFLICT (id) DO NOTHING;

-- ═══ 5. Jobs (both approved + assigned so mechanics see two jobs in My Jobs) ═══
INSERT INTO public.jobs (job_number, vehicle_id, customer_id, site_id, po_number, po_date, description, status, assigned_mechanic_id)
VALUES
  ('JOB-SEED-001', 'd0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001',
   'PO-2026-001', CURRENT_DATE, 'Scheduled service and brake inspection', 'approved', 'b0000001-0000-4000-8000-000000000001'),
  ('JOB-SEED-002', 'd0000002-0000-4000-8000-000000000002', 'c0000002-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001',
   'PO-2026-002', CURRENT_DATE, 'Pre-trip inspection and tyre check', 'approved', 'b0000001-0000-4000-8000-000000000001')
ON CONFLICT (job_number) DO NOTHING;

-- If you already ran an older seed (JOB-SEED-002 was quoted/unassigned), run once:
-- UPDATE public.jobs SET status = 'approved', assigned_mechanic_id = 'b0000001-0000-4000-8000-000000000001' WHERE job_number = 'JOB-SEED-002';

-- ═══ 6. Defects for JOB-SEED-001 (outstanding defects for manager review / test flow) ═══
INSERT INTO public.defects (job_id, description, severity, evidence_urls, customer_approval_status, estimated_cost_cents)
SELECT j.id, 'Brake pads worn >50% — front axle', 'RED', '{}', 'pending', 45000
FROM public.jobs j WHERE j.job_number = 'JOB-SEED-001' LIMIT 1;
INSERT INTO public.defects (job_id, description, severity, evidence_urls, customer_approval_status, estimated_cost_cents)
SELECT j.id, 'Minor oil seep — rear diff housing', 'ORANGE', '{}', 'pending', 12000
FROM public.jobs j WHERE j.job_number = 'JOB-SEED-001' LIMIT 1;

-- ═══ 7. Safety checklist for JOB-SEED-001 (optional — lets mechanic skip safety page for that job in testing) ═══
INSERT INTO public.job_safety_checklists (job_id, mechanic_id, safe_environment, not_blocking_job, vin_entered, completed_at)
SELECT j.id, 'b0000001-0000-4000-8000-000000000001', true, true, '6T1BF3EK5CU123456', NOW()
FROM public.jobs j
WHERE j.job_number = 'JOB-SEED-001'
  AND NOT EXISTS (
    SELECT 1 FROM public.job_safety_checklists c
    WHERE c.job_id = j.id AND c.mechanic_id = 'b0000001-0000-4000-8000-000000000001'
  )
LIMIT 1;
