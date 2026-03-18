# Mechanic daily flow — Clock on

## Flow in place

1. **Mechanic signs in** → redirected to `/dashboard` → then to `/mechanic/jobs` (role-based).

2. **On `/mechanic/jobs`:**
   - App checks for an **active shift** (from AuthContext: `shifts` where `mechanic_id` = user and `clock_off_at` is null).
   - **If no active shift** → user is sent to **`/mechanic/clock-on`** (L-01: must be clocked on to see jobs).

3. **On `/mechanic/clock-on`:**
   - If the user is **already clocked on** → redirected to `/mechanic/jobs`.
   - Otherwise: current time, site (from profile), and a **fit-for-work** confirmation (L-01) are shown.
   - User ticks “I confirm I am fit for work…” and clicks **Clock on**.
   - `useShift().clockOn()` inserts a row into **shifts** (`mechanic_id`, `site_id`, `clock_on_at`, optional `fit_for_work_declaration`).
   - After success → redirected to **`/mechanic/jobs`**, where they see their assigned jobs.

4. **On `/mechanic/jobs` (when clocked on):**
   - Shift start time is shown.
   - **Clock off** button calls `useShift().clockOff()` (sets `clock_off_at` on the shift, ends any active time entry), then redirects to `/mechanic/clock-on` for the next day.

So **clock on is part of the daily flow**: mechanics cannot see their job list until they have clocked on; after clock off they are back at the clock-on screen.

## Code references

- **Clock-on page:** `src/app/mechanic/clock-on/page.tsx` (ProtectedRoute mechanic, useShift, fit-for-work, redirect to jobs).
- **Jobs page:** `src/app/mechanic/jobs/page.tsx` (uses AuthContext `activeShift`; if no active shift → redirect to clock-on; Clock off → useShift.clockOff then redirect to clock-on).
- **Shift hook:** `src/hooks/useShift.ts` (clockOn with `mechanic_id`, `clock_on_at`, `fit_for_work_declaration`; clockOff sets `clock_off_at` and pauses active time entries).
- **AuthContext:** Loads active shift for mechanics on login (`shifts?mechanic_id=eq.${userId}&clock_off_at=is.null`).

## Schema (shifts)

- `mechanic_id`, `site_id`, `clock_on_at`, `clock_off_at`, `fit_for_work_declaration` (JSONB), `created_at`, `updated_at`.
- Active shift = `clock_off_at` is null.
