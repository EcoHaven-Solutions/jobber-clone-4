-- Lets the public quote form create a REAL estimate (a row in "quotes")
-- that's linked to a Lead instead of a Customer. Justen reviews the Lead,
-- and once the job's accepted he converts the Lead to a Customer -- at
-- that point the linked estimate automatically gets attached to the new
-- Customer too (handled in the app's code, not here).
--
-- Also adds a public_token column so a customer can click "Accept This
-- Estimate" in their confirmation email and flip the estimate's status
-- without logging into anything.
--
-- Safe to run even if some of this already exists -- every statement is
-- guarded (IF NOT EXISTS / conditional drop).

-- 1. A quote can now belong to a Lead instead of a Customer (at least until
--    it's converted), so customer_id can no longer be required.
alter table public.quotes
  alter column customer_id drop not null;

-- 2. Which Lead this quote came from, until it's converted to a Customer.
--    ON DELETE SET NULL so deleting a Lead later never blocks or cascades
--    into deleting the estimate itself.
alter table public.quotes
  add column if not exists lead_id bigint references public.leads(id) on delete set null;

-- 3. A random, unguessable token so the public accept-link can update one
--    specific quote's status with no login at all.
alter table public.quotes
  add column if not exists public_token text unique;
