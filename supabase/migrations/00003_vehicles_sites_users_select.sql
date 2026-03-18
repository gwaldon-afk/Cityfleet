-- Allow authenticated users to read sites, vehicles, users, user_roles
-- so Workshop Manager can load job board, create-job form (customers, vehicles),
-- and assign mechanic (users with role mechanic at site).

CREATE POLICY "Authenticated read active sites"
ON sites FOR SELECT TO authenticated
USING (status = 'active');

CREATE POLICY "Authenticated read active vehicles"
ON vehicles FOR SELECT TO authenticated
USING (status = 'active');

CREATE POLICY "Authenticated read active users"
ON users FOR SELECT TO authenticated
USING (status = 'active');

CREATE POLICY "Authenticated read user_roles"
ON user_roles FOR SELECT TO authenticated
USING (true);
