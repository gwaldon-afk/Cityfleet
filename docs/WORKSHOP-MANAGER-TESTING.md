# Workshop Manager — Testing steps

Use this when you want to test the **Workshop Manager** flow: approve jobs that mechanics have submitted for review.

## Prerequisites

1. **Supabase reachable**  
   The app must be able to connect to Supabase. If you see `ERR_CONNECTION_TIMED_OUT` in the browser console when the mechanic submits completion, fix network/VPN/firewall so the app can reach your Supabase project. Manager actions (load dashboard, approve job) also need this connection.

2. **A job in “Ready for review”**  
   A mechanic must have completed the job flow and clicked **SUBMIT FOR MANAGER REVIEW** on the completion page. That sets the job status to `ready_for_review`. If submission failed due to timeouts, no job will be in that state.

## What to do

1. **Log in as Workshop Manager**
   - Open the app login page (e.g. `http://localhost:3006/login`).
   - Email: **manager@cityfleet.local**
   - Password: **Password1!**
   - Sign in. You should be redirected to the **Manager dashboard**.

2. **Open the Manager dashboard**
   - The dashboard shows jobs that need attention, including **Ready for review**.
   - Click the job you want to approve (the one the mechanic just submitted).

3. **Approve the job**
   - On the job detail page you’ll see the completion info and a disclaimer.
   - Tick the disclaimer (e.g. “I have reviewed the work and approve this job”).
   - Click **Approve job**.
   - The job status becomes **manager_approved**.

4. **After approval**
   - The mechanic can do **final sign-off** for that job (mechanic flow: job → Final sign-off).
   - The manager can continue reviewing other jobs from the dashboard.

## Test logins (from seed)

| Role             | Email                    | Password  |
|------------------|--------------------------|-----------|
| Workshop Manager | manager@cityfleet.local | Password1! |
| Mechanic         | mechanic@cityfleet.local | Password1! |

See `docs/SEED-DATA.md` for full seed users and troubleshooting (e.g. closing stale time entries).
