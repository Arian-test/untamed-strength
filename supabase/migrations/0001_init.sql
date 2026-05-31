-- Untamed Strength — initial PostgreSQL / Supabase schema
-- Single-user personal app. user_id columns + RLS are included so the same
-- schema can back a Supabase project later; the local-first app does not use them.
--
-- Apply with the Supabase CLI:  supabase db push
-- or paste into the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reference: RPE chart (percentage of e1RM per reps x RPE)
-- Mirrors src/lib/rpe.ts so the math can also live in the database / SQL views.
-- ---------------------------------------------------------------------------
create table if not exists rpe_chart (
  reps        smallint not null check (reps between 1 and 12),
  rpe         numeric(3,1) not null check (rpe between 6 and 10),
  percentage  numeric(4,1) not null,
  primary key (reps, rpe)
);

-- ---------------------------------------------------------------------------
-- Core training data
-- ---------------------------------------------------------------------------
create table if not exists blocks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid default auth.uid(),
  name         text not null,
  start_date   date,
  squat_e1rm   numeric(5,1) not null,
  bench_e1rm   numeric(5,1) not null,
  active_week  smallint not null default 1 check (active_week between 1 and 5),
  created_at   timestamptz not null default now()
);

create table if not exists block_weeks (
  id           uuid primary key default gen_random_uuid(),
  block_id     uuid not null references blocks(id) on delete cascade,
  week_number  smallint not null check (week_number between 1 and 5),
  phase        text not null check (phase in ('Volume','Intensification','Peak')),
  scheme       text not null,
  unique (block_id, week_number)
);

create table if not exists session_days (
  id            uuid primary key default gen_random_uuid(),
  week_id       uuid not null references block_weeks(id) on delete cascade,
  day_key       text not null check (day_key in ('mon','wed','thu','sun')),
  title         text not null,
  planned_date  date,
  completed_at  timestamptz,
  note          text not null default '',
  -- readiness (1-5 each); null until filled in
  voeding       smallint check (voeding between 1 and 5),
  stress        smallint check (stress between 1 and 5),
  slaap         smallint check (slaap between 1 and 5),
  fatigue       smallint check (fatigue between 1 and 5)
);

create table if not exists exercises (
  id             uuid primary key default gen_random_uuid(),
  session_day_id uuid not null references session_days(id) on delete cascade,
  position       smallint not null,
  name           text not null,
  kind           text not null check (kind in ('main','variation','accessory')),
  lift           text check (lift in ('squat','bench')),
  factor         numeric(4,3) not null default 1.0,
  muscle_groups  text[] not null default '{}',
  note           text not null default ''
);

create table if not exists sets (
  id              uuid primary key default gen_random_uuid(),
  exercise_id     uuid not null references exercises(id) on delete cascade,
  set_number      smallint not null,
  target_reps     smallint not null,
  target_rpe      numeric(3,1) not null,
  planned_weight  numeric(5,1),
  is_backoff      boolean not null default false,
  actual_weight   numeric(5,1),
  actual_reps     smallint,
  actual_rpe      numeric(3,1)
);

create table if not exists e1rm_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid default auth.uid(),
  block_id    uuid references blocks(id) on delete set null,
  session_id  uuid references session_days(id) on delete cascade,
  lift        text not null check (lift in ('squat','bench')),
  e1rm        numeric(5,1) not null,
  recorded_at timestamptz not null default now()
);

create table if not exists bodyweight_log (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid default auth.uid(),
  log_date  date not null,
  weight    numeric(5,1) not null,
  unique (user_id, log_date)
);

create table if not exists settings (
  user_id     uuid primary key default auth.uid(),
  rounding_kg numeric(4,2) not null default 2.5,
  bodyweight  numeric(5,1)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_block_weeks_block on block_weeks(block_id);
create index if not exists idx_session_days_week on session_days(week_id);
create index if not exists idx_exercises_session on exercises(session_day_id);
create index if not exists idx_sets_exercise on sets(exercise_id);
create index if not exists idx_e1rm_lift_date on e1rm_history(lift, recorded_at);

-- ---------------------------------------------------------------------------
-- Row Level Security (for a future authenticated Supabase deployment)
-- ---------------------------------------------------------------------------
alter table blocks         enable row level security;
alter table e1rm_history   enable row level security;
alter table bodyweight_log enable row level security;
alter table settings       enable row level security;

create policy "own blocks"   on blocks         using (user_id = auth.uid());
create policy "own e1rm"     on e1rm_history   using (user_id = auth.uid());
create policy "own bw"       on bodyweight_log using (user_id = auth.uid());
create policy "own settings" on settings       using (user_id = auth.uid());
