-- F05: Kredi bakiyesi yalnız doğrulanmış sunucu işlemleriyle değiştirilebilir.
-- Mevcut geçişleri değiştirmeden, kurulmuş veritabanlarına da uygulanır.
-- /pg/query sunucuda service-role anahtarıyla kullanılır; tarayıcı RPC erişimi yoktur.

revoke execute on function public.add_credits(uuid, integer, numeric, text, text, text)
  from public, anon, authenticated;
revoke execute on function public.deduct_credits(uuid, integer, text)
  from public, anon, authenticated;
revoke execute on function public.handle_new_user()
  from public, anon, authenticated;

grant execute on function public.add_credits(uuid, integer, numeric, text, text, text)
  to service_role;
grant execute on function public.deduct_credits(uuid, integer, text)
  to service_role;

-- SECURITY DEFINER içindeki ilişkiler şemalarıyla belirtilmiştir.
alter function public.add_credits(uuid, integer, numeric, text, text, text)
  set search_path = '';
alter function public.deduct_credits(uuid, integer, text)
  set search_path = '';
alter function public.handle_new_user()
  set search_path = '';
