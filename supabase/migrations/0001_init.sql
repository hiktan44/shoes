-- Fasheone Shoes — initial schema
-- generations: kullanıcının ürettiği tüm görseller (foto / tasarim / rotush / poz / albüm)

create extension if not exists "pgcrypto";

create table if not exists public.generations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  result_url   text not null,
  mode         text not null default 'foto',          -- foto | tasarim | rotush
  vibe         text,                                   -- Stüdyo | Albüm | poseId | Rötuş ...
  shoe_type    text,
  prompt       text,
  aspect_ratio text,
  created_at   timestamptz not null default now()
);

create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

-- Row Level Security: herkes yalnızca kendi kayıtlarını görür/yazar/siler
alter table public.generations enable row level security;

drop policy if exists "own_select" on public.generations;
create policy "own_select" on public.generations
  for select using (auth.uid() = user_id);

drop policy if exists "own_insert" on public.generations;
create policy "own_insert" on public.generations
  for insert with check (auth.uid() = user_id);

drop policy if exists "own_delete" on public.generations;
create policy "own_delete" on public.generations
  for delete using (auth.uid() = user_id);

drop policy if exists "own_update" on public.generations;
create policy "own_update" on public.generations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
