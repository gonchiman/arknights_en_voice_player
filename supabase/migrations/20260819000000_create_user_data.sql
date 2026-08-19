begin;

create table if not exists public.favorite_operators (
  user_id uuid not null references auth.users (id) on delete cascade,
  operator_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, operator_id)
);

create table if not exists public.favorite_voices (
  user_id uuid not null references auth.users (id) on delete cascade,
  voice_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, voice_id)
);

create table if not exists public.dictation_attempts (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  voice_id text not null,
  score integer not null check (score between 0 and 100),
  correct boolean not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists dictation_attempts_user_created_at_idx
  on public.dictation_attempts (user_id, created_at desc);

alter table public.favorite_operators enable row level security;
alter table public.favorite_voices enable row level security;
alter table public.dictation_attempts enable row level security;

revoke all on public.favorite_operators from anon, authenticated;
revoke all on public.favorite_voices from anon, authenticated;
revoke all on public.dictation_attempts from anon, authenticated;

grant select, insert, delete on public.favorite_operators to authenticated;
grant select, insert, delete on public.favorite_voices to authenticated;
grant select, insert, delete on public.dictation_attempts to authenticated;

drop policy if exists "Users can read own operator favorites"
  on public.favorite_operators;
create policy "Users can read own operator favorites"
  on public.favorite_operators
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add own operator favorites"
  on public.favorite_operators;
create policy "Users can add own operator favorites"
  on public.favorite_operators
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own operator favorites"
  on public.favorite_operators;
create policy "Users can delete own operator favorites"
  on public.favorite_operators
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own voice favorites"
  on public.favorite_voices;
create policy "Users can read own voice favorites"
  on public.favorite_voices
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add own voice favorites"
  on public.favorite_voices;
create policy "Users can add own voice favorites"
  on public.favorite_voices
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own voice favorites"
  on public.favorite_voices;
create policy "Users can delete own voice favorites"
  on public.favorite_voices
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own dictation attempts"
  on public.dictation_attempts;
create policy "Users can read own dictation attempts"
  on public.dictation_attempts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add own dictation attempts"
  on public.dictation_attempts;
create policy "Users can add own dictation attempts"
  on public.dictation_attempts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own dictation attempts"
  on public.dictation_attempts;
create policy "Users can delete own dictation attempts"
  on public.dictation_attempts
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

commit;
