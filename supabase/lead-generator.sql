-- Apply after add_two_lines_sync.sql.
alter table public.leads add column if not exists discovery_key text unique;
alter table public.sms_queue add column if not exists discovery_lead_id bigint
  references public.leads(id) on delete set null;
alter table public.sms_queue add column if not exists is_lead_outreach boolean not null default false;

create table if not exists public.lead_outreach (
  lead_id bigint primary key references public.leads(id) on delete cascade,
  channel text not null check (channel in ('sms', 'email')),
  recipient text not null,
  consent_note text,
  status text not null,
  queue_id bigint references public.sms_queue(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (channel, recipient)
);
alter table public.lead_outreach enable row level security;

create or replace function public.queue_discovered_lead_sms(
  p_lead bigint, p_phone text, p_consent text, p_body text
) returns bigint language plpgsql set search_path = '' as $$
declare queued bigint;
begin
  insert into public.lead_outreach(lead_id, channel, recipient, consent_note, status)
  values (p_lead, 'sms', p_phone, p_consent, 'queued');
  insert into public.sms_queue(to_phone, body, discovery_lead_id, is_lead_outreach)
  values (p_phone, p_body, p_lead, true) returning id into queued;
  update public.lead_outreach set queue_id = queued where lead_id = p_lead;
  return queued;
end;
$$;
revoke execute on function public.queue_discovered_lead_sms(bigint,text,text,text) from public, anon, authenticated;
grant execute on function public.queue_discovered_lead_sms(bigint,text,text,text) to service_role;
