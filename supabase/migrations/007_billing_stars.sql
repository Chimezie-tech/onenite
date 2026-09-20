-- ============================================================
-- OneNite — Migration 007: recurring subscriptions + expiry-aware limits
-- ============================================================
alter table public.subscriptions add column if not exists telegram_subscription_id text;
alter table public.subscriptions add column if not exists cancelled_at timestamptz;

-- Premium must respect expiry even before any cleanup job runs
create or replace function public.enforce_like_limits()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  sender public.profiles%rowtype;
  lim    public.daily_limits%rowtype;
  is_prem boolean;
begin
  if new.is_pass then return new; end if;
  select * into sender from profiles where id = new.from_user_id;
  is_prem := sender.is_premium
             and (sender.premium_expires_at is null or sender.premium_expires_at > now());

  if is_prem and not new.is_super then return new; end if;

  insert into daily_limits (user_id, limit_date)
  values (new.from_user_id, current_date)
  on conflict (user_id, limit_date) do nothing;

  select * into lim from daily_limits
   where user_id = new.from_user_id and limit_date = current_date
   for update;

  if new.is_super then
    if lim.super_likes_used >= (case when is_prem then 5 else 1 end) then
      raise exception 'SUPER_LIKE_LIMIT';
    end if;
    update daily_limits set super_likes_used = super_likes_used + 1 where id = lim.id;
  else
    if lim.likes_used >= 10 then
      raise exception 'DAILY_LIKE_LIMIT';
    end if;
    update daily_limits set likes_used = likes_used + 1 where id = lim.id;
  end if;
  return new;
end $$;