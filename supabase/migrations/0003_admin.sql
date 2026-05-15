-- Admin paneli — profiles.is_admin bayrağı
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Admin'in kendi profilini görmesi yeterli (mevcut profile_own_select politikası geçerli).
-- Admin işlemleri sunucu tarafında service-role (/pg/query) ile yapılır, RLS bypass edilir.

create index if not exists profiles_is_admin_idx on public.profiles (is_admin) where is_admin = true;
