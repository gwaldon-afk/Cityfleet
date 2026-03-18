-- Administrator: manage users (read all + update status), assign/remove roles and sites, manage sites.
-- Run after 00003 (existing read policies). Admin = user_roles.role = 'administrator'.

-- ─── USERS: Admins see all (including inactive) and can update ─────────────────
CREATE POLICY "Admins read all users"
ON users FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'administrator')
);

CREATE POLICY "Admins update users"
ON users FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'administrator')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'administrator')
);

-- ─── USER_ROLES: Admins can add/remove role assignments ────────────────────────
CREATE POLICY "Admins insert user_roles"
ON user_roles FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'administrator')
);

CREATE POLICY "Admins delete user_roles"
ON user_roles FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'administrator')
);

-- ─── SITES: Admins see all sites and can update (for future site management) ───
CREATE POLICY "Admins read all sites"
ON sites FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'administrator')
);

CREATE POLICY "Admins update sites"
ON sites FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'administrator')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'administrator')
);
