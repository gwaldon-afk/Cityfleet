-- Workshop Manager: read/update defects for jobs at their site; read parts, manage job_parts for site jobs.
-- Mechanics: insert/select defects for their assigned jobs.

-- Defects: Mechanics can SELECT and INSERT for their assigned jobs
CREATE POLICY "Mechanics view assigned job defects"
ON defects FOR SELECT TO authenticated
USING (
  job_id IN (SELECT id FROM jobs WHERE assigned_mechanic_id = auth.uid())
);

CREATE POLICY "Mechanics insert defects on assigned job"
ON defects FOR INSERT TO authenticated
WITH CHECK (
  job_id IN (SELECT id FROM jobs WHERE assigned_mechanic_id = auth.uid())
);

-- Defects: WM can SELECT and UPDATE (for customer_approval_status, estimated_cost_cents)
CREATE POLICY "WM view site job defects"
ON defects FOR SELECT TO authenticated
USING (
  job_id IN (
    SELECT j.id FROM jobs j
    INNER JOIN user_roles ur ON j.site_id = ur.site_id AND ur.site_id IS NOT NULL
    WHERE ur.user_id = auth.uid() AND ur.role = 'workshop_manager'
  )
);

CREATE POLICY "WM update site job defects"
ON defects FOR UPDATE TO authenticated
USING (
  job_id IN (
    SELECT j.id FROM jobs j
    INNER JOIN user_roles ur ON j.site_id = ur.site_id AND ur.site_id IS NOT NULL
    WHERE ur.user_id = auth.uid() AND ur.role = 'workshop_manager'
  )
)
WITH CHECK (
  job_id IN (
    SELECT j.id FROM jobs j
    INNER JOIN user_roles ur ON j.site_id = ur.site_id AND ur.site_id IS NOT NULL
    WHERE ur.user_id = auth.uid() AND ur.role = 'workshop_manager'
  )
);

-- Parts: authenticated users can read active parts (for ordering)
CREATE POLICY "Authenticated read active parts"
ON parts FOR SELECT TO authenticated
USING (status = 'active');

-- Job_parts: WM can manage (SELECT, INSERT, UPDATE) for jobs at their site
CREATE POLICY "WM view site job_parts"
ON job_parts FOR SELECT TO authenticated
USING (
  job_id IN (
    SELECT j.id FROM jobs j
    INNER JOIN user_roles ur ON j.site_id = ur.site_id AND ur.site_id IS NOT NULL
    WHERE ur.user_id = auth.uid() AND ur.role = 'workshop_manager'
  )
);

CREATE POLICY "WM insert site job_parts"
ON job_parts FOR INSERT TO authenticated
WITH CHECK (
  job_id IN (
    SELECT j.id FROM jobs j
    INNER JOIN user_roles ur ON j.site_id = ur.site_id AND ur.site_id IS NOT NULL
    WHERE ur.user_id = auth.uid() AND ur.role = 'workshop_manager'
  )
);

CREATE POLICY "WM update site job_parts"
ON job_parts FOR UPDATE TO authenticated
USING (
  job_id IN (
    SELECT j.id FROM jobs j
    INNER JOIN user_roles ur ON j.site_id = ur.site_id AND ur.site_id IS NOT NULL
    WHERE ur.user_id = auth.uid() AND ur.role = 'workshop_manager'
  )
);

-- Mechanics need to read job_parts for their assigned jobs (for parts page)
CREATE POLICY "Mechanics read assigned job_parts"
ON job_parts FOR SELECT TO authenticated
USING (
  job_id IN (
    SELECT id FROM jobs WHERE assigned_mechanic_id = auth.uid()
  )
);
