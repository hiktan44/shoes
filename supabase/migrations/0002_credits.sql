-- Fasheone Shoes — kredi sistemi
-- profiles: kullanıcı kredi bakiyesi (yeni üye 10 ücretsiz kredi)
-- transactions: tüm kredi hareketleri (satın alma / kullanım / bonus)

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  credits     integer not null default 10,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  type          text not null,                 -- purchase | usage | bonus | refund
  credits       integer not null,              -- pozitif (ekleme) / negatif (kullanım)
  amount        numeric(12,2),                 -- TL tutarı (satın almada)
  currency      text default 'TRY',
  reason        text,                          -- 'studio' | 'design' | 'pose' | 'album' | 'retouch' | 'analyze' | 'package_SMALL' ...
  provider      text,                          -- 'stripe'
  provider_ref  text,                          -- stripe session/payment_intent id
  status        text not null default 'completed',
  created_at    timestamptz not null default now()
);

create index if not exists tx_user_created_idx on public.transactions (user_id, created_at desc);
create unique index if not exists tx_provider_ref_uidx on public.transactions (provider_ref) where provider_ref is not null;

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "profile_own_select" on public.profiles;
create policy "profile_own_select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "tx_own_select" on public.transactions;
create policy "tx_own_select" on public.transactions
  for select using (auth.uid() = user_id);
-- INSERT/UPDATE yalnızca service_role (RPC) üzerinden; normal kullanıcıya yazma izni yok.

-- Yeni kullanıcı kaydolunca otomatik profil + 10 ücretsiz kredi + bonus kaydı
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, credits) values (new.id, 10)
    on conflict (id) do nothing;
  insert into public.transactions (user_id, type, credits, reason, status)
    values (new.id, 'bonus', 10, 'signup_bonus', 'completed');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomik kredi düşme: yeterli bakiye yoksa false döner, varsa düşer + işlem kaydı yazar
create or replace function public.deduct_credits(p_user uuid, p_amount integer, p_reason text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;

  select credits into v_balance from public.profiles where id = p_user for update;
  if v_balance is null then
    insert into public.profiles (id, credits) values (p_user, 10)
      on conflict (id) do nothing;
    select credits into v_balance from public.profiles where id = p_user for update;
  end if;

  if v_balance < p_amount then
    return jsonb_build_object('ok', false, 'error', 'insufficient', 'balance', v_balance);
  end if;

  update public.profiles set credits = credits - p_amount, updated_at = now() where id = p_user;
  insert into public.transactions (user_id, type, credits, reason, status)
    values (p_user, 'usage', -p_amount, p_reason, 'completed');

  return jsonb_build_object('ok', true, 'balance', v_balance - p_amount);
end;
$$;

-- Kredi ekleme (satın alma fulfillment) — idempotent: aynı provider_ref ikinci kez işlenmez
create or replace function public.add_credits(
  p_user uuid, p_amount integer, p_amount_paid numeric, p_reason text,
  p_provider text, p_provider_ref text
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_exists integer;
  v_balance integer;
begin
  if p_provider_ref is not null then
    select 1 into v_exists from public.transactions where provider_ref = p_provider_ref limit 1;
    if v_exists is not null then
      select credits into v_balance from public.profiles where id = p_user;
      return jsonb_build_object('ok', true, 'duplicate', true, 'balance', v_balance);
    end if;
  end if;

  insert into public.profiles (id, credits) values (p_user, p_amount + 10)
    on conflict (id) do update set credits = public.profiles.credits + p_amount, updated_at = now();

  insert into public.transactions (user_id, type, credits, amount, reason, provider, provider_ref, status)
    values (p_user, 'purchase', p_amount, p_amount_paid, p_reason, p_provider, p_provider_ref, 'completed');

  select credits into v_balance from public.profiles where id = p_user;
  return jsonb_build_object('ok', true, 'balance', v_balance);
end;
$$;

-- Mevcut kullanıcılar için geriye dönük profil (varsa atla)
insert into public.profiles (id, credits)
  select id, 10 from auth.users
  on conflict (id) do nothing;
