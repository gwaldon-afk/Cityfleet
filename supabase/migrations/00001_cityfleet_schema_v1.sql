-- City Fleet Workshop Manager — Full Schema v1.0
-- PostgreSQL DDL for Supabase | February 2026
-- Run in Supabase SQL Editor (run in order; tables created in dependency order)

-- =============================================================================
-- SCHEMA: Users & Authentication
-- =============================================================================

CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address_street TEXT,
  address_suburb TEXT,
  address_city TEXT NOT NULL,
  address_state TEXT NOT NULL,
  address_postcode TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  timezone TEXT NOT NULL DEFAULT 'Australia/Sydney',
  operating_hours_start TIME,
  operating_hours_end TIME,
  capacity_bays INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sites_status ON sites(status);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  mobile_number TEXT,
  employee_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('mechanic', 'workshop_manager', 'ops_manager', 'administrator')),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role, site_id)
);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_site ON user_roles(site_id);

-- =============================================================================
-- SCHEMA: Vehicles & Customers (before jobs)
-- =============================================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address_street TEXT,
  address_suburb TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postcode TEXT,
  labour_rate_cents INTEGER,
  parts_margin_percent DECIMAL(5,2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_customers_status ON customers(status);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  registration_number TEXT,
  vin TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  odometer_km INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);

-- =============================================================================
-- SCHEMA: Jobs & Labour
-- =============================================================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number TEXT NOT NULL UNIQUE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  site_id UUID NOT NULL REFERENCES sites(id),
  po_number TEXT NOT NULL,
  po_date DATE NOT NULL,
  work_type TEXT,
  description TEXT NOT NULL,
  quoted_labour_hours DECIMAL(10,2),
  quoted_parts_cost DECIMAL(10,2),
  quoted_total DECIMAL(10,2),
  assigned_mechanic_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'quoted' CHECK (status IN (
    'quoted', 'approved', 'in_progress', 'paused', 'awaiting_parts',
    'awaiting_approval', 'ready_for_review', 'manager_approved',
    'mechanic_closed', 'ops_review', 'closed_released'
  )),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  manager_approved_at TIMESTAMPTZ,
  manager_approved_by UUID REFERENCES users(id),
  ops_approved_at TIMESTAMPTZ,
  ops_approved_by UUID REFERENCES users(id),
  invoiced_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_jobs_number ON jobs(job_number);
CREATE INDEX idx_jobs_vehicle ON jobs(vehicle_id);
CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_site ON jobs(site_id);
CREATE INDEX idx_jobs_assigned_mechanic ON jobs(assigned_mechanic_id);

CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mechanic_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  clock_on_at TIMESTAMPTZ NOT NULL,
  clock_off_at TIMESTAMPTZ,
  fit_for_work_declaration JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_shifts_mechanic ON shifts(mechanic_id);
CREATE INDEX idx_shifts_site ON shifts(site_id);
CREATE INDEX idx_shifts_clock_on ON shifts(clock_on_at);

CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  mechanic_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  pause_reason_code TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_time_entries_job ON time_entries(job_id);
CREATE INDEX idx_time_entries_mechanic ON time_entries(mechanic_id);
CREATE INDEX idx_time_entries_start ON time_entries(start_time);

-- =============================================================================
-- SCHEMA: Parts & Costs
-- =============================================================================

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_suppliers_status ON suppliers(status);

CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT NOT NULL,
  description TEXT,
  unit_price_cents INTEGER,
  standard_supplier_id UUID REFERENCES suppliers(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_parts_part_number ON parts(part_number);
CREATE INDEX idx_parts_status ON parts(status);

CREATE TABLE job_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_cost_cents INTEGER,
  supplier_id UUID REFERENCES suppliers(id),
  lifecycle_status TEXT NOT NULL DEFAULT 'ordered' CHECK (lifecycle_status IN ('ordered', 'received', 'fitted', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_job_parts_job ON job_parts(job_id);
CREATE INDEX idx_job_parts_part ON job_parts(part_id);

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  po_number TEXT NOT NULL,
  po_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_purchase_orders_job ON purchase_orders(job_id);
CREATE INDEX idx_purchase_orders_customer ON purchase_orders(customer_id);

CREATE TABLE supplier_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  job_part_id UUID REFERENCES job_parts(id) ON DELETE SET NULL,
  invoice_number TEXT,
  amount_cents INTEGER,
  invoice_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_supplier_invoices_supplier ON supplier_invoices(supplier_id);
CREATE INDEX idx_supplier_invoices_job_part ON supplier_invoices(job_part_id);

-- =============================================================================
-- SCHEMA: Evidence & Notes
-- =============================================================================

CREATE TABLE defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('RED', 'ORANGE')),
  evidence_urls TEXT[],
  customer_approval_status TEXT CHECK (customer_approval_status IN ('pending', 'approved', 'rejected')),
  estimated_cost_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_defects_job ON defects(job_id);

CREATE TABLE job_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes INTEGER,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_job_attachments_job ON job_attachments(job_id);

CREATE TABLE job_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_ai_cleaned BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_job_notes_job ON job_notes(job_id);

-- =============================================================================
-- SCHEMA: Billing & Audit
-- =============================================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  total_cents INTEGER NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('invoice', 'card', 'cash', 'other')),
  pdf_url TEXT,
  invoice_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_invoices_job ON invoices(job_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TRIGGERS: Business rules
-- =============================================================================

CREATE OR REPLACE FUNCTION check_one_active_job()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM time_entries te
    WHERE te.mechanic_id = NEW.mechanic_id
      AND te.end_time IS NULL
      AND te.id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'Mechanic already has an active job';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_one_active_job
  BEFORE INSERT OR UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION check_one_active_job();

CREATE OR REPLACE FUNCTION check_po_before_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (NEW.po_number IS NULL OR NEW.po_number = '' OR NEW.po_date IS NULL) THEN
    RAISE EXCEPTION 'Job cannot be approved without PO number and date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_po_requirement
  BEFORE INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION check_po_before_approval();

CREATE OR REPLACE FUNCTION prevent_edit_after_invoice()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_locked = TRUE THEN
    RAISE EXCEPTION 'Cannot modify invoiced/released job';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_immutability
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_edit_after_invoice();

-- =============================================================================
-- Enable RLS on all tables (policies applied in separate migration)
-- =============================================================================

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
