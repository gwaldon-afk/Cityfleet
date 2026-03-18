# Invoices and vehicle release

## Rule: vehicle cannot be released until payment made and cleared

Once an **invoice** has been created for a job, the **vehicle must not be released** (job must not move to **closed_released**) until **payment has been made and cleared**.

### How it’s enforced

1. **`invoices.payment_cleared_at`**  
   When payment is received and cleared, set this to the timestamp (e.g. `NOW()`). Until it is set, the job cannot be released.

2. **Database trigger**  
   Updating a job’s status to `closed_released` runs a check:  
   - If the job has any rows in `invoices`, then **every** invoice for that job must have `payment_cleared_at` set.  
   - If any invoice has `payment_cleared_at` NULL, the update is rejected with:  
     *"Vehicle cannot be released: invoice exists but payment has not been made and cleared."*

### Ops / app flow

1. **Create invoice**  
   Insert into `invoices` (job_id, invoice_number, total_cents, payment_type, invoice_date, …).  
   Do **not** set `payment_cleared_at` until payment is actually received and cleared.

2. **Record payment cleared**  
   When payment is made and cleared, update the invoice:  
   `UPDATE invoices SET payment_cleared_at = NOW(), updated_at = NOW() WHERE id = ?`

3. **Release job**  
   Only then allow the job to be moved to `closed_released` (and set `released_at` if used). The trigger will allow it once all invoices for that job have `payment_cleared_at` set.

### Customer: database or cash

- **Create job:** Customer can be chosen **from the database** (existing customers) or entered **manually for cash / walk-in** (name and vehicle details created on the fly).  
- Workshop Manager can create customers and vehicles (RLS allows WM insert on `customers` and `vehicles`) for cash jobs.
