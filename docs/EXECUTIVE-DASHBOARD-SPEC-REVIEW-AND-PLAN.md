# Executive Dashboard spec — review, gaps, product decisions, build plan

**Source:** City Fleet Workshop Manager App — Executive Dashboard Wireframe v1.0 (Feb 2026)  
**Repo status:** Operational WM/Ops flows exist; **no** EXEC-01…06 screens yet. WM dashboard has a **live mechanics** table (not full EXEC-01/02 analytics).

---

## 1. Does this spec cover what we need?

**Yes, for product/UI intent:** The six views, metrics, charts, filters, export, access matrix, and refresh hints are enough to **design screens and acceptance criteria**.

Implementation still needs **RLS/views** for cross-site aggregates and **drill-down** routes (agreed below).

---

## 2. Fit vs current database & app

| Spec area | Notes (updated after product decisions) |
|-----------|----------------------------------------|
| **EXEC-01** | **Hide** workshop capacity / bays for v1 (not tracking bays). Other real-time tiles and mechanic utilization remain. |
| **EXEC-02** | **Billable** rule locked (§3). Use `time_entries` segments; exclude paused rows from billable hours. |
| **EXEC-03** | Unchanged — aggregate from jobs, job_parts, invoices, customers. |
| **EXEC-04** | Report **both** turnaround metrics (§3). **Rework** = `jobs.billing_category = 'rework_no_charge'` (migration `00013_jobs_billing_category.sql`). |
| **EXEC-05** | Ops sees **all sites**; mechanics need **network-wide** peer comparison (§3) — requires **RLS or secure RPC/views**. |
| **EXEC-06** | **Drill-down** to job detail (read-only) — good for v1; defer acknowledge/assign workflow if needed. |

---

## 3. Product decisions (agreed — Feb 2026)

| # | Topic | Decision |
|---|--------|----------|
| **1** | **Billable hours** | Billable time = time while the job timer is **active work**. **Paused** periods are **not** billable (job on hold). **Implementation:** sum labour from `time_entries` where the segment is **not** a pause record — i.e. exclude rows with `status = 'paused'` (app already sets this on pause). Include `completed` segments and open `active` segments (duration to now). |
| **2** | **Rework** | New **category** on the job: client **has been invoiced** and the job **must be redone at no cost** to the client. Stored as **`jobs.billing_category = 'rework_no_charge'`** (default **`standard`**). Used for reporting, first-time fix / quality metrics, and exceptions. |
| **3** | **Turnaround** | Report **both**: (A) **start → mechanic_closed** (or operational completion), (B) **start → closed_released** (full cycle including ops). Use `jobs.started_at`, `completed_at` / mechanic close signals, and `released_at` as available in schema — align exact fields in build tickets. |
| **4** | **Bays / capacity** | **Not** tracking by bays for now — **hide** capacity gauge and any bay-based KPIs in EXEC-01 until a later phase. |
| **5** | **Ops multi-site** | **All sites** — `ops_manager` executive views aggregate **network-wide** (subject to secure implementation). |
| **6** | **Drill-down** | **Yes** — charts and summary cards link through to **filtered job lists** and **job detail (read-only)** where appropriate. |
| **7** | **Roles** | **No separate executive role** — use **`ops_manager`** for executive dashboards. **Mechanics** must be able to open a **read-only performance** view comparing **themselves to all other mechanics across all sites** (labour/productivity style metrics). Requires explicit **policies or `SECURITY DEFINER` RPCs** so mechanics do not gain inappropriate access to PII/job detail on other sites. |
| **8** | **Refresh** | **60 seconds** auto-refresh for v1. Centralise via **`src/lib/dashboard-constants.ts`** (`DASHBOARD_AUTO_REFRESH_MS`, optional `NEXT_PUBLIC_DASHBOARD_REFRESH_MS` later). |

### 3.1 First-time fix & rework (reporting note)

- Jobs flagged **`rework_no_charge`** count as **rework** in quality metrics.  
- **First-time fix** / similar KPIs should be defined in implementation as: e.g. share of completed jobs (excluding pure rework category) that did not require a follow-up rework job — exact formula in EXEC-04 build ticket.

### 3.2 Mechanic network leaderboard (access)

- **Goal:** mechanic A sees aggregated stats for all mechanics (e.g. billable %, jobs completed in period) **without** opening other customers’ job PII.  
- **Approach:** prefer **SQL views or RPCs** returning only **aggregates by `mechanic_id` + name** (or anonymised rank) with **`SECURITY DEFINER`** and role check `mechanic OR ops_manager`, **not** broad `SELECT` on `jobs` cross-site.

---

## 4. Recommended build plan (phased)

### Phase 0 — Foundations

- Apply migration **`00013_jobs_billing_category.sql`**; add UI for WM/Ops to set **Rework (no charge)** when creating/editing a job (later ticket).  
- Implement **RLS/RPC strategy** for: (a) ops all-sites aggregates, (b) mechanic-safe cross-site **aggregate** reads only.  
- Thresholds: **`system_config`** or app constants (margin %, overdue days) — v1 constants OK.

### Phase 1 — EXEC-01 MVP (no bays) — **implemented**

- **Routes:** `/ops/executive/realtime` (ops_manager, all sites) · `/manager/executive/realtime` (workshop_manager, current site).  
- **UI:** KPI cards (active in progress, mechanics clocked on / total, completed today, avg turnaround → mechanic close & → released), status breakdown bars (click to filter), hourly completions chart, mechanics table (billable h today, click to filter by assignee), full job list with drill-down filters.  
- **No** bay/capacity gauge.  
- **Refresh:** `getDashboardRefreshIntervalMs()` (default **60s**).  
- **Billable h today:** sums `time_entries` overlapping today, excluding rows with `pause_reason_code` set.  
- **RLS:** run migration **`00014_ops_network_dashboard_rls.sql`** so ops can read jobs/shifts/time_entries network-wide.

### Phase 2 — EXEC-02 Labour productivity

- Billable % using **§3.1** rules; mechanic comparison bar chart; CSV export.  
- **Mechanic** route: e.g. **`/mechanic/performance`** — read-only comparison vs all mechanics (aggregates only).

### Phase 3 — EXEC-03 Cost & margin

- As per wireframe; margin violations; customer table.

### Phase 4 — EXEC-04 Job performance

- Both turnaround series; rework surfaced via **`billing_category`**; bottleneck charts when stage data exists.

### Phase 5 — EXEC-05 Multi-site matrix

- Site ranking table; ops only (and mechanics only for their peer metric slice if needed).

### Phase 6 — EXEC-06 Exceptions

- Exception list + **drill-down** to read-only job; optional alerts later.

### Cross-cutting

- Chart library (e.g. Recharts); CSV export; document SQL views/RPCs.

---

## 5. Summary

| Item | Status |
|------|--------|
| Wireframe spec | Sufficient for UX |
| Product decisions | **Locked in §3** |
| Schema for rework | **`billing_category`** in `00013_jobs_billing_category.sql` |
| Refresh interval | **`dashboard-constants.ts`** — 60s, overridable later |
| Next build step | Phase 0 RLS/RPC + Phase 1 EXEC-01 (no bays, drill-down, 60s) |

---

## 6. Previous “open questions” — resolved

Questions from the earlier review are **superseded by §3**. **ADMIN-05** thresholds remain **constants / system_config** until an admin UI exists.
