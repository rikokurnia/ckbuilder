create table if not exists public.agent_bounty_state (
  id text primary key check (id = 'default'),
  revision bigint not null default 0 check (revision >= 0),
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.agent_bounty_state enable row level security;

revoke all on table public.agent_bounty_state from anon, authenticated;
grant all on table public.agent_bounty_state to service_role;

comment on table public.agent_bounty_state is
  'Server-only AgentBounty state. Browser roles have no access; service-role writes use revision compare-and-swap.';
