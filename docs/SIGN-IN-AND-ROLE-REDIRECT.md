# Sign-in and role-based redirect

## Confirmed flow

1. **Sign-in**
   - User enters email/password on `/login`.
   - `AuthContext.login()` calls **Supabase Auth** (`/auth/v1/token?grant_type=password`).
   - On success, the session is stored in `localStorage` under a key derived from your Supabase project URL.
   - `loadUserProfile(authUserId, token)` runs and fetches:
     - **users** (row where `id` = Supabase Auth user id)
     - **user_roles** (row where `user_id` = that id; first role only)
     - **sites** (if the role has a `site_id`)
   - Context state is set: `user`, `role`, `site`. For mechanics, **active shift** is also loaded from **shifts** (where `mechanic_id` = user id and `clock_off_at` is null).

2. **Redirect to dashboard**
   - Login page does `router.push('/dashboard')` after a successful login.
   - So every signed-in user hits `/dashboard` first.

3. **Role-based redirect from `/dashboard`**
   - `/dashboard` is wrapped in `ProtectedRoute` (unauthenticated users are sent to `/login`).
   - Once `user` and `role` are loaded, a `useEffect` redirects by role:

   | Role              | Redirect target        |
   |-------------------|------------------------|
   | `mechanic`       | `/mechanic/jobs`       |
   | `workshop_manager`| `/manager/dashboard`   |
   | `ops_manager`     | `/ops/dashboard`       |
   | `administrator`   | `/admin/users`         |
   | (none / other)    | `/login`               |

   So the user is taken to their role-specific area automatically.

4. **Role-specific pages**
   - **Mechanic:** `/mechanic/jobs` (and the rest of the mechanic flow: clock-on, job detail, safety, diagnosis, defects, parts, completion, test, sign-off).
   - **Workshop manager:** `/manager/dashboard` (placeholder; Job Board and manager tools to be built).
   - **Ops manager:** `/ops/dashboard` (placeholder; close-out queue and release to be built).
   - **Administrator:** `/admin/users` (placeholder; user management and audit to be built).

   Each of these routes can use `ProtectedRoute` with `allowedRoles` so only the right role can access them (others get `/unauthorized`).

## Where roles come from

- **Supabase:** `auth.users` (email/password) and your app tables **users** and **user_roles**.
- **users:** One row per person, `id` = Supabase Auth user id.
- **user_roles:** Rows like `(user_id, role, site_id)` with `role` in `('mechanic','workshop_manager','ops_manager','administrator')`.
- The app uses the **first** role returned for the user for the dashboard redirect. If a user has multiple roles, only one is used for this automatic redirect.

## AuthContext and env

- **Supabase URL** and **anon key** come from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (no hardcoded project URL).
- Session storage key is derived from the project URL so it stays correct across different Supabase projects/environments.

## Summary

- Sign-in is working against Supabase Auth and your `users` / `user_roles` data.
- After login, users are sent to `/dashboard`, then immediately redirected to the correct page for their role. Mechanics go to the mechanic area; workshop managers, ops managers, and administrators go to their respective placeholder dashboards until those screens are built out.
