-- Handoff — the nervous system & off-switch for autonomous agents.
-- Run this in the Supabase SQL editor once. Everything is append-only events.

-- The nervous system: every agent action is exactly one row here.
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  lead_id     uuid,                         -- correlates the 3 agents for one lead
  agent       text not null,                -- 'intake' | 'qualifier' | 'invoicer' | 'system'
  action      text not null,                -- human-readable: "scored lead", "created invoice"
  input       jsonb,                        -- the payload the agent saw
  confidence  numeric,                      -- 0.00-1.00 (null for non-decisions)
  decision    text,                         -- auto_proceed | escalate | blocked | approved | rejected
  status      text not null default 'done', -- processing | done | awaiting_approval | blocked | killed
  reason      text                          -- WHY — the decision-trace log
);

-- System-level kill switch: a row every agent MUST read before acting.
-- This is the off-switch that is NOT a polite prompt an agent can ignore.
create table if not exists control (
  id         int primary key default 1,
  paused     boolean not null default false,
  threshold  numeric not null default 0.7,   -- auto-run at/above this confidence
  cap        numeric not null default 250,   -- payments above this need a human
  business   text,                           -- what the agents govern
  updated_at timestamptz not null default now()
);
-- migration for existing projects:
alter table control add column if not exists threshold numeric not null default 0.7;
alter table control add column if not exists cap numeric not null default 250;
alter table control add column if not exists business text;
insert into control (id, paused) values (1, false)
  on conflict (id) do nothing;

-- Leads flowing through the agency.
create table if not exists leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  source      text,                          -- whatsapp | form | simulator
  contact     text,
  raw_message text,
  amount      numeric,
  stage       text not null default 'intake' -- intake|qualified|escalated|invoiced|blocked
);

-- Live dashboard needs realtime + full row data on changes.
alter table events  replica identity full;
alter table control replica identity full;
alter table leads   replica identity full;

-- Add tables to the realtime publication (ignore if already added).
do $$
begin
  alter publication supabase_realtime add table events;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table control;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table leads;
exception when duplicate_object then null; end $$;
