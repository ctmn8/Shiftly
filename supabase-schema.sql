-- Run this in your Supabase SQL editor at:
-- https://supabase.com/dashboard/project/mrxbfitxfgbwyaepswvx/sql

-- Jobs table (populated nightly by cron)
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  description text,
  location text,
  city text default 'Colorado Springs',
  pay_min numeric,
  pay_max numeric,
  pay_display text,
  apply_url text,
  min_age integer default 16,
  tags text[] default '{}',
  source text, -- 'adzuna' | 'careerjet' | 'muse' | 'scrape'
  source_id text, -- original ID from source to dedup
  lat numeric,
  lng numeric,
  fetched_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  school text,
  age integer,
  availability jsonb default '{}', -- { days: ['Sat','Sun'], hours_per_week: 15 }
  interests text[] default '{}',
  transport text, -- 'car' | 'bus' | 'bike' | 'walk'
  deal_breakers text[] default '{}',
  lat numeric, -- derived from school location
  lng numeric,
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Matches table (pre-computed nightly)
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete cascade,
  score integer, -- 0-100
  explanation text,
  seen boolean default false,
  created_at timestamptz default now(),
  unique(user_id, job_id)
);

-- Applications tracker
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete cascade,
  applied_at timestamptz,
  followup_date date,
  status text default 'applied', -- 'applied' | 'followed_up' | 'interview' | 'hired' | 'rejected'
  notes text,
  created_at timestamptz default now(),
  unique(user_id, job_id)
);

-- Indexes for fast queries
create index if not exists jobs_fetched_at_idx on jobs(fetched_at desc);
create index if not exists jobs_source_id_idx on jobs(source, source_id);
create index if not exists matches_user_id_idx on matches(user_id);
create index if not exists matches_score_idx on matches(user_id, score desc);
create index if not exists applications_user_id_idx on applications(user_id);
create index if not exists applications_followup_idx on applications(followup_date) where followup_date is not null;

-- Row Level Security
alter table profiles enable row level security;
alter table matches enable row level security;
alter table applications enable row level security;

-- Profiles: users can only see/edit their own
create policy "users own profile" on profiles
  for all using (auth.uid() = id);

-- Matches: users only see their own
create policy "users own matches" on matches
  for all using (auth.uid() = user_id);

-- Applications: users only see their own
create policy "users own applications" on applications
  for all using (auth.uid() = user_id);

-- Jobs: public read (anyone can browse), only service role can write
create policy "jobs are public" on jobs
  for select using (true);

-- Saved jobs (run in Supabase SQL editor)
create table if not exists saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, job_id)
);
alter table saved_jobs enable row level security;
create policy "users own saved jobs" on saved_jobs for all using (auth.uid() = user_id);
