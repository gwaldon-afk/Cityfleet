# Admin page — Build plan and functions

This document details the build plan and functions for the **Administrator** area of the City Fleet app. The admin user exists in seed (`admin@cityfleet.local`) and can log in; the current Admin Users page is a placeholder.

---

## 1. Scope summary

| Area | Purpose | DB / RLS today |
|------|--------|-----------------|
| **User management** | List users, set active/inactive, assign roles and sites | `users`, `user_roles`; admins need write access (new RLS). |
| **Customer pricing** | View/edit customer labour and parts margins | `customers`; admins already have full CRUD (RLS done). |
| **Audit log** | View and filter system actions for compliance | `audit_log`; admins can SELECT (RLS done); insert from app/triggers. |
| **Sites (optional)** | Add/edit sites, set active/inactive | `sites`; admins need write access (new RLS) if building. |

---

## 2. User management

### 2.1 Goals

- Administrators can see all users (including inactive).
- Activate/deactivate users (set `users.status` = active/inactive).
- Assign roles and sites: add/remove rows in `user_roles` (role + site_id) so a user can act as mechanic, workshop_manager, or ops_manager at a given site (or administrator with no site).

### 2.2 Functions

| Function | Description |
|----------|-------------|
| **List users** | Table: name, email, status (active/inactive), roles (e.g. “Mechanic @ Sydney”, “Workshop Manager @ Sydney”), last login if available. Filter by status, role, or site. |
| **View user** | Detail view: profile (first_name, last_name, email, mobile_number, employee_id), status, and all current role/site assignments. |
| **Set user status** | Toggle or dropdown to set `users.status` to `active` or `inactive`. Inactive users should not be able to log in (enforce in app or via Supabase Auth). |
| **Assign role and site** | Add a role: choose role (mechanic, workshop_manager, ops_manager, administrator) and, for non-admin roles, choose site. Persist as new row in `user_roles`. |
| **Remove role/site** | Remove a specific (role, site_id) assignment for the user (delete row in `user_roles`). Prevent removing the last administrator if you need at least one. |
| **Create user (optional)** | Invite/create user: create auth user (Supabase Auth Admin API or edge function), then insert into `public.users` and `user_roles`. Out of scope for MVP if you prefer admins to create users in Supabase Dashboard. |

### 2.3 Data and RLS

- **Tables:** `users` (id, first_name, last_name, email, status, …), `user_roles` (user_id, role, site_id), `sites` (for labels).
- **RLS:** Today only SELECT exists on `users` and `user_roles`. Add migration:
  - **Admins manage users:** Administrator can UPDATE `users` (at least `status`; optionally name/email if desired).
  - **Admins manage user_roles:** Administrator can SELECT, INSERT, DELETE (and optionally UPDATE) on `user_roles` so they can assign/remove role and site.

### 2.4 UI sketch

- **Route:** `/admin/users` (current placeholder).
- **List:** Table with columns User, Email, Status, Roles, Actions (View / Edit).
- **Detail/Edit:** Page or modal: user info, status dropdown, list of “Role @ Site” with Add assignment / Remove.

---

## 3. Customer pricing

### 3.1 Goals

- Administrators can view and edit customer-level pricing used for quoting/billing: labour rate and parts margin.

### 3.2 Functions

| Function | Description |
|----------|-------------|
| **List customers** | Table: name, contact, labour rate (display as $/hr or cents), parts margin %, status. Filter by status. |
| **Edit customer pricing** | Form or inline edit: `labour_rate_cents`, `parts_margin_percent` (and any other pricing fields). Save to `customers`. Optional: “forward-only” rule so past jobs are not recalculated (business rule only; no DB change needed for MVP). |

### 3.3 Data and RLS

- **Table:** `customers` (existing). Columns relevant to pricing: `labour_rate_cents`, `parts_margin_percent` (schema 00001).
- **RLS:** “Admins manage customers” already gives administrators full CRUD on `customers`; no new migration.

### 3.4 UI sketch

- **Route:** `/admin/customers` or a “Pricing” tab under `/admin`.
- **List:** Table of customers with pricing columns and an Edit action.
- **Edit:** Modal or page with labour rate (e.g. input in dollars converted to cents) and parts margin %.

---

## 4. Audit log

### 4.1 Goals

- Administrators can view a chronological log of important actions (who did what, when) for compliance and support.

### 4.2 Functions

| Function | Description |
|----------|-------------|
| **View audit log** | List entries: date/time, user (id or name), action (e.g. “job_updated”, “invoice_created”), entity type and id, optional old/new values (or summary). |
| **Filter** | Filter by date range, user, entity_type, action. |
| **Export (optional)** | Export filtered results to CSV. |

### 4.3 Data and RLS

- **Table:** `audit_log` (id, entity_type, entity_id, action, old_data, new_data, user_id, created_at). RLS: only admins can SELECT; any authenticated user can INSERT (for app/trigger use).
- **Population:** Ensure key actions (job status change, invoice create/update, user status change, etc.) write to `audit_log` (via app code or DB triggers). If not yet implemented, add incrementally.

### 4.4 UI sketch

- **Route:** `/admin/audit` or “Audit log” tab.
- **List:** Table with columns Date, User, Action, Entity, (optional) Summary. Pagination and filters (date range, user, entity type, action).

---

## 5. Sites (optional)

### 5.1 Goals

- If the business needs admins to add or edit locations: create/edit sites, set active/inactive.

### 5.2 Functions

| Function | Description |
|----------|-------------|
| **List sites** | Table: name, address (city/state), timezone, status. |
| **Create site** | Form: name, address fields, timezone, status. Insert into `sites`. |
| **Edit site** | Update name, address, timezone, status. |

### 5.3 Data and RLS

- **Table:** `sites`. Currently only SELECT for authenticated (active). Add “Admins manage sites” (SELECT, INSERT, UPDATE) for administrator role.

### 5.4 UI sketch

- **Route:** `/admin/sites`. List + Create/Edit form or modal.

---

## 6. Implementation order

Suggested order so each step is usable on its own:

| Phase | Deliverable | Dependencies |
|-------|-------------|--------------|
| **1** | **RLS for admin users and user_roles** | Migration: admin UPDATE users; admin SELECT/INSERT/DELETE user_roles. |
| **2** | **User management UI** | List users (with roles/sites), view user, set status, add/remove role+site. |
| **3** | **Customer pricing UI** | List customers, edit labour_rate_cents and parts_margin_percent. (RLS already in place.) |
| **4** | **Audit log UI** | List audit_log with filters (date, user, entity_type, action); pagination. Optionally ensure key actions write to audit_log. |
| **5** | **Sites (optional)** | RLS for admin on sites; list/create/edit sites. |

---

## 7. Technical notes

- **Auth:** Creating new users (invite/sign-up) requires Supabase Auth Admin API or a backend that can create auth users; then insert into `public.users` and `user_roles`. For MVP, “user management” can be limited to editing existing users (status, role/site) and creating users only in Supabase Dashboard.
- **Navigation:** Admin area can have a simple top-level nav: Users | Customers (or Pricing) | Audit log | Sites (if built).
- **Consistency:** Reuse existing patterns (ProtectedRoute, createClient, hooks) and styling (City Fleet colours, tables, forms) from the manager/ops pages.

---

## 8. Summary

| Function area | Main functions | RLS status |
|---------------|----------------|------------|
| **User management** | List users, set status, assign/remove role and site | New migration needed |
| **Customer pricing** | List customers, edit labour rate and parts margin | Already in place |
| **Audit log** | View and filter audit entries | Already in place (SELECT for admins) |
| **Sites** | List, create, edit sites (optional) | New migration if built |

This plan gives a clear order of work and function list for the admin page and related backend.
