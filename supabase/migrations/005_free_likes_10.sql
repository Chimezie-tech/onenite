-- ============================================================
-- OneNite — Migration 005: free daily likes 15 -> 10
-- Keeps server-side enforcement in sync with constants.ts
-- ============================================================

create or replace function public.enforce_like_limits()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  sender public.profiles%rowtype;
  lim    public.daily_limits%rowtype;
begin
  if new.is_pass then return new; end if;   -- passing is always free
  select * into sender from profiles where id = new.from_user_id;

  if sender.is_premium and not new.is_super then
    return new;                              -- premium = unlimited normal likes
  end if;

  insert into daily_limits (user_id, limit_date)
  values (new.from_user_id, current_date)
  on conflict (user_id, limit_date) do nothing;

  select * into lim from daily_limits
   where user_id = new.from_user_id and limit_date = current_date
   for update;

  if new.is_super then
    if lim.super_likes_used >= (case when sender.is_premium then 5 else 1 end) then
      raise exception 'SUPER_LIKE_LIMIT';
    end if;
    update daily_limits set super_likes_used = super_likes_used + 1 where id = lim.id;
  else
    if lim.likes_used >= 10 then             -- ← product decision: 10/day free
      raise exception 'DAILY_LIKE_LIMIT';
    end if;
    update daily_limits set likes_used = likes_used + 1 where id = lim.id;
  end if;
  return new;
end $$;