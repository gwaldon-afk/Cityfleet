# City Fleet — Seed data

After running `supabase/seed.sql` (and optionally `supabase/seed_phase_b.sql`) in the Supabase SQL Editor, you can sign in with these test accounts. All passwords: **Password1!**

## Phase A — Test users (seed.sql)

| Role              | Email                    | Site              | Name          |
|-------------------|--------------------------|-------------------|---------------|
| Mechanic          | mechanic@cityfleet.local | City Fleet Sydney | Alex Mechanic |
| Workshop Manager  | manager@cityfleet.local  | City Fleet Sydney | Sam Manager   |
| Ops Manager       | ops@cityfleet.local      | City Fleet Sydney | Jordan Ops    |
| Administrator     | admin@cityfleet.local    | (all sites)       | Admin User    |

## Phase B — Extra users (seed_phase_b.sql)

Run `supabase/seed_phase_b.sql` **after** `seed.sql` to add a second site, more mechanics, and more customers/vehicles.

| Role              | Email                     | Site                | Name           |
|-------------------|----------------------------|---------------------|----------------|
| Workshop Manager  | manager2@cityfleet.local  | City Fleet Brisbane | Morgan Manager |
| Mechanic          | mechanic2@cityfleet.local | City Fleet Sydney   | Blake Mechanic |
| Mechanic          | mechanic3@cityfleet.local | City Fleet Sydney   | Casey Mechanic |
| Mechanic          | mechanic4@cityfleet.local | City Fleet Brisbane | Drew Mechanic  |
| Mechanic          | mechanic5@cityfleet.local | City Fleet Brisbane | Emery Mechanic |

## What the seeds create

**After seed.sql (Phase A):**
- **1 site:** City Fleet Sydney (Sydney, NSW)
- **2 customers:** Acme Transport Co, Metro Freight Pty Ltd
- **2 vehicles:** ABC-123 (Volvo FH16), XYZ-789 (Scania R500)
- **2 jobs:** JOB-SEED-001 (approved, assigned to Alex), JOB-SEED-002 (quoted, unassigned)

**After seed_phase_b.sql (Phase B):**
- **2nd site:** City Fleet Brisbane (Eagle Farm, QLD)
- **4 customers total:** Acme Transport Co, Metro Freight Pty Ltd, Queensland Haulage Pty Ltd, National Logistics Co (with full contact/address details)
- **10 vehicles total:** 2 per customer for Acme/Metro, plus NSW-456, NSW-789, SYD-111, SYD-222, QLD-300, QLD-301, BRI-100, BRI-101 (various makes: Mercedes, Isuzu, Kenworth, DAF, Volvo, Mack, Scania, Iveco)
- **2 Brisbane jobs:** JOB-SEED-B01 (quoted), JOB-SEED-B02 (approved, assigned to Drew)

## How to test

1. Run all migrations, then run `supabase/seed.sql` in the Supabase SQL Editor.
2. (Optional) Run `supabase/seed_phase_b.sql` for 2 sites, multiple mechanics, and extra customers/vehicles.
3. Ensure **Email** provider is enabled in Authentication → Providers.
4. Open the app login page and sign in with any email above and `Password1!`.
5. **Sydney site:** manager@cityfleet.local — 3 mechanics (Alex, Blake, Casey) available to assign. **Brisbane site:** manager2@cityfleet.local — 2 mechanics (Drew, Emery).

**Security:** Change or remove seed users and password before any production or shared environment.

## Troubleshooting

**"Mechanic already has an active job" when starting a job**  
The DB allows only one open time entry per mechanic. If a previous test left one open, close it in Supabase SQL Editor (seed mechanic id below):

```sql
UPDATE time_entries SET end_time = NOW() WHERE mechanic_id = 'b0000001-0000-4000-8000-000000000001' AND end_time IS NULL;
```
