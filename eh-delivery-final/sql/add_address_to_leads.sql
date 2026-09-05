-- Adds an "address" column to the leads table, so leads coming in from the
-- public quote form and the free catalog request can capture a service
-- address, same as customers already do. Safe to run even if it somehow
-- already exists (IF NOT EXISTS guards it).
alter table public.leads
  add column if not exists address text;
