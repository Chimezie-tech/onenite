-- ============================================================
-- OneNite — Migration 010: growth loop, views, and re-engagement
-- ============================================================
alter table public.profiles add column if not exists referral_code text unique;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id);
alter table public.profiles add column if not exists bonus_likes integer not null default 0;
alter table public.profiles add column if not exists last_reengaged_at timestamptz;

-- Generate codes for existing users
update public.profiles
set referral_code = substr(md5(random()::text || clock_timestamp()::text), 1, 8)
where referral_code is null;

-- Referrals table (1 invite = 1 row)
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (referred_id)
);

-- Profile views (anti-spam: 1 view per 24h per pair)
create table public.profile_views (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index idx_profile_views_viewed on public.profile_views (viewed_id, created_at desc);

-- Helper to safely grant bonus likes
create or replace function public.grant_referral_bonus(referrer_uuid uuid)
returns void language sql security definer as $$
  update public.profiles set bonus_likes = bonus_likes + 1 where id = referrer_uuid;
$$;

grant select, insert on public.referrals to authenticated;
grant select, insert on public.profile_views to authenticated;
grant execute on function public.grant_referral_bonus(uuid) to authenticated;

-- Update like trigger to consume referral bonus_likes first
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

  if new.is_super and sender.bonus_super_likes > 0 then
    update profiles set bonus_super_likes = bonus_super_likes - 1 where id = sender.id;
    return new;
  end if;

  -- Consume referral bonus likes for normal likes
  if not new.is_super and sender.bonus_likes > 0 then
    update profiles set bonus_likes = bonus_likes - 1 where id = sender.id;
    return new;
  end if;

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