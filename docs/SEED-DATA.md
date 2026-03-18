# City Fleet — Seed data (Phase A)

After running `supabase/seed.sql` in the Supabase SQL Editor, you can sign in with these test accounts.

## Test users

| Role              | Email                    | Password  | Name          |
|-------------------|--------------------------|-----------|---------------|
| Mechanic          | mechanic@cityfleet.local | Password1! | Alex Mechanic |
| Workshop Manager  | manager@cityfleet.local | Password1! | Sam Manager   |
| Ops Manager       | ops@cityfleet.local     | Password1! | Jordan Ops    |
| Administrator     | admin@cityfleet.local   | Password1! | Admin User    |

All roles (except Administrator) are linked to the seed site **City Fleet Sydney**.

## What the seed creates

- **1 site:** City Fleet Sydney (Sydney, NSW)
- **2 customers:** Acme Transport Co, Metro Freight Pty Ltd
- **2 vehicles:** ABC-123 (Volvo FH16), XYZ-789 (Scania R500)
- **2 jobs:**
  - **JOB-SEED-001** — Assigned to Alex (mechanic), status **approved**, with **2 outstanding defects** (1 RED, 1 ORANGE) for manager review
  - **JOB-SEED-002** — Unassigned, status **quoted**

## How to test

1. Run all migrations, then run `supabase/seed.sql` in the SQL Editor.
2. Ensure **Email** provider is enabled in Authentication → Providers.
3. Open the app login page and sign in with any email above and `Password1!`.
4. You should be redirected by role: mechanic → clock-on/jobs, manager → manager dashboard, ops → ops dashboard, admin → admin.

**Security:** Change or remove seed users and password before any production or shared environment.

## Troubleshooting

**"Mechanic already has an active job" when starting a job**  
The DB allows only one open time entry per mechanic. If a previous test left one open, close it in Supabase SQL Editor (seed mechanic id below):

```sql
UPDATE time_entries SET end_time = NOW() WHERE mechanic_id = 'b0000001-0000-4000-8000-000000000001' AND end_time IS NULL;
```
