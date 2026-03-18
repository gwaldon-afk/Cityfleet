-- ═══════════════════════════════════════════════════════════════════════════
-- City Fleet — Seed data (Phase B): 2nd site, extra WM, mechanics, customers, vehicles
-- Run after seed.sql. All new test users: password Password1!
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  v_pw TEXT := crypt('Password1!', gen_salt('bf'));
  v_site1_id UUID := 'a0000001-0000-4000-8000-000000000001';
  v_site2_id UUID := 'a0000002-0000-4000-8000-000000000002';
  v_wm2_id   UUID := 'b0000005-0000-4000-8000-000000000005';
  v_mech2_id UUID := 'b0000006-0000-4000-8000-000000000006';
  v_mech3_id UUID := 'b0000007-0000-4000-8000-000000000007';
  v_mech4_id UUID := 'b0000008-0000-4000-8000-000000000008';
  v_mech5_id UUID := 'b0000009-0000-4000-8000-000000000009';
BEGIN
  -- ═══ 1. Second site ═══
  INSERT INTO public.sites (id, name, address_street, address_suburb, address_city, address_state, address_postcode, contact_phone, contact_email, timezone, status)
  VALUES (v_site2_id, 'City Fleet Brisbane', '200 Workshop Rd', 'Eagle Farm', 'Brisbane', 'QLD', '4009', '07 3123 4567', 'brisbane@cityfleet.local', 'Australia/Brisbane', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- ═══ 2. Workshop Manager for Site 2 ═══
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (v_wm2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'manager2@cityfleet.local', v_pw, NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Morgan","last_name":"Manager"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (v_wm2_id, v_wm2_id, format('{"sub":"%s","email":"manager2@cityfleet.local"}', v_wm2_id)::jsonb, 'email', v_wm2_id::text, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.users (id, first_name, last_name, email, status)
  VALUES (v_wm2_id, 'Morgan', 'Manager', 'manager2@cityfleet.local', 'active')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role, site_id) VALUES (v_wm2_id, 'workshop_manager', v_site2_id)
  ON CONFLICT (user_id, role, site_id) DO NOTHING;

  -- ═══ 3. Two more mechanics — Site 1 (Sydney) ═══
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (v_mech2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'mechanic2@cityfleet.local', v_pw, NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Blake","last_name":"Mechanic"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (v_mech2_id, v_mech2_id, format('{"sub":"%s","email":"mechanic2@cityfleet.local"}', v_mech2_id)::jsonb, 'email', v_mech2_id::text, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.users (id, first_name, last_name, email, status)
  VALUES (v_mech2_id, 'Blake', 'Mechanic', 'mechanic2@cityfleet.local', 'active')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role, site_id) VALUES (v_mech2_id, 'mechanic', v_site1_id)
  ON CONFLICT (user_id, role, site_id) DO NOTHING;

  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (v_mech3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'mechanic3@cityfleet.local', v_pw, NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Casey","last_name":"Mechanic"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (v_mech3_id, v_mech3_id, format('{"sub":"%s","email":"mechanic3@cityfleet.local"}', v_mech3_id)::jsonb, 'email', v_mech3_id::text, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.users (id, first_name, last_name, email, status)
  VALUES (v_mech3_id, 'Casey', 'Mechanic', 'mechanic3@cityfleet.local', 'active')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role, site_id) VALUES (v_mech3_id, 'mechanic', v_site1_id)
  ON CONFLICT (user_id, role, site_id) DO NOTHING;

  -- ═══ 4. Two mechanics — Site 2 (Brisbane) ═══
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (v_mech4_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'mechanic4@cityfleet.local', v_pw, NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Drew","last_name":"Mechanic"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (v_mech4_id, v_mech4_id, format('{"sub":"%s","email":"mechanic4@cityfleet.local"}', v_mech4_id)::jsonb, 'email', v_mech4_id::text, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.users (id, first_name, last_name, email, status)
  VALUES (v_mech4_id, 'Drew', 'Mechanic', 'mechanic4@cityfleet.local', 'active')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role, site_id) VALUES (v_mech4_id, 'mechanic', v_site2_id)
  ON CONFLICT (user_id, role, site_id) DO NOTHING;

  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (v_mech5_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'mechanic5@cityfleet.local', v_pw, NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Emery","last_name":"Mechanic"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (v_mech5_id, v_mech5_id, format('{"sub":"%s","email":"mechanic5@cityfleet.local"}', v_mech5_id)::jsonb, 'email', v_mech5_id::text, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.users (id, first_name, last_name, email, status)
  VALUES (v_mech5_id, 'Emery', 'Mechanic', 'mechanic5@cityfleet.local', 'active')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role, site_id) VALUES (v_mech5_id, 'mechanic', v_site2_id)
  ON CONFLICT (user_id, role, site_id) DO NOTHING;

END $$;

-- ═══ 5. Two more customers (full contact details) ═══
INSERT INTO public.customers (id, name, contact_name, contact_email, contact_phone, address_street, address_suburb, address_city, address_state, address_postcode, status)
VALUES
  ('c0000003-0000-4000-8000-000000000003', 'Queensland Haulage Pty Ltd', 'Chris Taylor', 'chris@qhaulage.com.au', '07 3456 7890', '45 Industrial Ave', 'Lytton', 'Brisbane', 'QLD', '4178', 'active'),
  ('c0000004-0000-4000-8000-000000000004', 'National Logistics Co', 'Samira Patel', 'samira@nationallogistics.com', '02 9988 7766', '12 Freight Way', 'Mascot', 'Sydney', 'NSW', '2020', 'active')
ON CONFLICT (id) DO NOTHING;

-- ═══ 6. Extra vehicles (spread across all 4 customers) ═══
INSERT INTO public.vehicles (id, customer_id, registration_number, vin, make, model, year, status)
VALUES
  ('d0000003-0000-4000-8000-000000000003', 'c0000001-0000-4000-8000-000000000001', 'NSW-456', 'WVWZZZ3CZWE123456', 'Mercedes', 'Actros', 2021, 'active'),
  ('d0000004-0000-4000-8000-000000000004', 'c0000001-0000-4000-8000-000000000001', 'NSW-789', '5UYZU42C56L098765', 'Isuzu', 'FRR 500', 2023, 'active'),
  ('d0000005-0000-4000-8000-000000000005', 'c0000002-0000-4000-8000-000000000002', 'SYD-111', '1FMFU18588LA12345', 'Kenworth', 'T410', 2022, 'active'),
  ('d0000006-0000-4000-8000-000000000006', 'c0000002-0000-4000-8000-000000000002', 'SYD-222', 'YV1LS56A1X1123456', 'DAF', 'XF 480', 2024, 'active'),
  ('d0000007-0000-4000-8000-000000000007', 'c0000003-0000-4000-8000-000000000003', 'QLD-300', '2H2XA59B78Y123456', 'Volvo', 'FM 500', 2022, 'active'),
  ('d0000008-0000-4000-8000-000000000008', 'c0000003-0000-4000-8000-000000000003', 'QLD-301', '3MZBM1U70FM123456', 'Mack', 'Anthem', 2023, 'active'),
  ('d0000009-0000-4000-8000-000000000009', 'c0000004-0000-4000-8000-000000000004', 'BRI-100', '4S4BTBCC2N3123456', 'Scania', 'G450', 2021, 'active'),
  ('d0000010-0000-4000-8000-000000000010', 'c0000004-0000-4000-8000-000000000004', 'BRI-101', '5XYPG4A36CG123456', 'Iveco', 'Stralis', 2023, 'active')
ON CONFLICT (id) DO NOTHING;

-- ═══ 7. Optional: jobs at Site 2 (Brisbane) for testing ═══
INSERT INTO public.jobs (job_number, vehicle_id, customer_id, site_id, po_number, po_date, description, status, assigned_mechanic_id)
VALUES
  ('JOB-SEED-B01', 'd0000007-0000-4000-8000-000000000007', 'c0000003-0000-4000-8000-000000000003', 'a0000002-0000-4000-8000-000000000002',
   'PO-BNE-001', CURRENT_DATE, 'Annual service and safety check', 'quoted', NULL),
  ('JOB-SEED-B02', 'd0000009-0000-4000-8000-000000000009', 'c0000004-0000-4000-8000-000000000004', 'a0000002-0000-4000-8000-000000000002',
   'PO-BNE-002', CURRENT_DATE, 'Coolant system flush and hose inspection', 'approved', 'b0000008-0000-4000-8000-000000000008')
ON CONFLICT (job_number) DO NOTHING;
