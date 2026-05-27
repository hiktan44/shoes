-- Kullanıcı askıya alma (suspend) — askıdaki kullanıcı üretim yapamaz
alter table public.profiles add column if not exists suspended boolean not null default false;

-- deduct_credits: askıdaysa üretimi reddet (tek noktadan enforcement)
create or replace function public.deduct_credits(p_user uuid, p_amount integer, p_reason text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_balance integer;
  v_susp boolean;
begin
  if p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;

  select credits, suspended into v_balance, v_susp from public.profiles where id = p_user for update;
  if v_balance is null then
    insert into public.profiles (id, credits) values (p_user, 10)
      on conflict (id) do nothing;
    select credits, suspended into v_balance, v_susp from public.profiles where id = p_user for update;
  end if;

  if v_susp then
    return jsonb_build_object('ok', false, 'error', 'suspended');
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
