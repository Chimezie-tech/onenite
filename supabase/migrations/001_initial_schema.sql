-- ============================================================
-- OneNite — Migration 001: Initial Schema
-- Tables, indexes, triggers, RLS, storage
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS (fixed vocabularies) ----------
create type public.gender as enum ('male', 'female', 'other');
create type public.interested_in as enum ('male', 'female', 'everyone');
create type public.moderation_status as enum ('pending', 'approved', 'rejected');
create type public.match_status as enum ('active', 'unmatched', 'blocked');
create type public.report_reason as enum ('fake', 'spam', 'inappropriate', 'underage', 'other');
create type public.report_status as enum ('pending', 'reviewed', 'action_taken');
create type public.plan_id as enum ('weekly', 'monthly', 'yearly');
create type public.payment_method as enum ('telegram_stars', 'flutterwave');
create type public.subscription_status as enum ('active', 'expired', 'cancelled');

-- ---------- TABLES ----------

create table public.profiles (
  id                   uuid primary key default gen_random_uuid(),
  telegram_id          bigint not null unique,
  first_name           text not null,
  username             text,
  photo_url            text,
  bio                  text not null default '',
  age                  integer not null check (age between 18 and 99),
  gender               public.gender not null,
  interested_in        public.interested_in not null default 'everyone',
  city                 text not null default '',
  country              text not null default '',
  interests            text[] not null default '{}',
  referrer_code        text,                          -- influencer who brought this user
  onboarding_completed boolean not null default false,
  is_premium           boolean not null default false,
  is_verified          boolean not null default false,
  is_banned            boolean not null default false,
  premium_expires_at   timestamptz,
  last_active_at       timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.profile_photos (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  photo_url         text not null,
  is_primary        boolean not null default false,
  moderation_status public.moderation_status not null default 'pending',
  moderation_reason text,
  created_at        timestamptz not null default now()
);
-- At most ONE primary photo per user, enforced by the database itself:
create unique index profile_photos_one_primary_idx
  on public.profile_photos (user_id) where is_primary;
create index profile_photos_user_idx on public.profile_photos (user_id);

create table public.likes (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id   uuid not null references public.profiles(id) on delete cascade,
  is_super     boolean not null default false,
  is_pass      boolean not null default false,   -- passes stored so we never re-show them
  created_at   timestamptz not null default now(),
  constraint likes_not_self check (from_user_id <> to_user_id),
  constraint likes_one_per_pair unique (from_user_id, to_user_id)
);
create index likes_from_idx on public.likes (from_user_id);
create index likes_to_idx   on public.likes (to_user_id);

create table public.matches (
  id              uuid primary key default gen_random_uuid(),
  user1_id        uuid not null references public.profiles(id) on delete cascade,
  user2_id        uuid not null references public.profiles(id) on delete cascade,
  status          public.match_status not null default 'active',
  last_message_at timestamptz not null default now(),  -- chat list ordering, no joins needed
  created_at      timestamptz not null default now(),
  constraint matches_ordered check (user1_id < user2_id),  -- canonical order = no duplicate matches
  constraint matches_unique_pair unique (user1_id, user2_id)
);
create index matches_user1_idx on public.matches (user1_id, status);
create index matches_user2_idx on public.matches (user2_id, status);

create table public.messages (
  id                uuid primary key default gen_random_uuid(),
  match_id          uuid not null references public.matches(id) on delete cascade,
  sender_id         uuid not null references public.profiles(id) on delete cascade,
  content           text not null check (char_length(content) between 1 and 1000),
  read_at           timestamptz,                        -- null = unread (drives ✓✓ receipts)
  moderation_status public.moderation_status not null default 'approved',
  created_at        timestamptz not null default now()
);
create index messages_match_idx on public.messages (match_id, created_at);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason      public.report_reason not null,
  details     text not null default '',
  status      public.report_status not null default 'pending',
  created_at  timestamptz not null default now(),
  constraint reports_not_self check (reporter_id <> reported_id),
  constraint reports_one_per_pair unique (reporter_id, reported_id)
);

create table public.subscriptions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  plan           public.plan_id not null,
  payment_method public.payment_method not null,
  payment_id     text,                                  -- Stars / Flutterwave transaction ref
  amount         numeric(10,2) not null,
  currency       text not null default 'XTR',           -- XTR = Telegram Stars, NGN etc.
  status         public.subscription_status not null default 'active',
  started_at     timestamptz not null default now(),
  expires_at     timestamptz not null,
  created_at     timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);
create index subscriptions_expiring_idx on public.subscriptions (expires_at)
  where status = 'active';

create table public.daily_limits (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  limit_date       date not null default current_date,
  likes_used       integer not null default 0,
  super_likes_used integer not null default 0,
  messages_sent    integer not null default 0,
  constraint daily_limits_one_per_day unique (user_id, limit_date)
);

create table public.blocks (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blocks_not_self check (blocker_id <> blocked_id),
  constraint blocks_unique unique (blocker_id, blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);

-- Discovery query accelerator (the swipe deck query in Phase 6):
create index profiles_discovery_idx on public.profiles (city, gender, age)
  where not is_banned and onboarding_completed;
create index profiles_last_active_idx on public.profiles (last_active_at desc);

-- ---------- TRIGGER FUNCTIONS (business rules live in the DB) ----------

-- Keep updated_at honest
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Cheat-proof daily limits. Runs BEFORE every like insert.
-- Free: 15 likes/day, 1 super like/day. Premium: unlimited likes, 5 super/day.
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
   for update;                               -- row lock = no race conditions

  if new.is_super then
    if lim.super_likes_used >= (case when sender.is_premium then 5 else 1 end) then
      raise exception 'SUPER_LIKE_LIMIT';
    end if;
    update daily_limits set super_likes_used = super_likes_used + 1 where id = lim.id;
  else
    if lim.likes_used >= 15 then
      raise exception 'DAILY_LIKE_LIMIT';
    end if;
    update daily_limits set likes_used = likes_used + 1 where id = lim.id;
  end if;
  return new;
end $$;

-- THE MATCHING ENGINE: mutual like => match. Atomic, race-proof.
create or replace function public.create_match_on_mutual_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  a uuid; b uuid;
begin
  if new.is_pass then return null; end if;
  if exists (
    select 1 from likes
     where from_user_id = new.to_user_id
       and to_user_id   = new.from_user_id
       and not is_pass
  ) then
    a := least(new.from_user_id, new.to_user_id);
    b := greatest(new.from_user_id, new.to_user_id);
    insert into matches (user1_id, user2_id) values (a, b)
    on conflict (user1_id, user2_id) do nothing;
  end if;
  return null;
end $$;

-- Free users: 100 messages/day
create or replace function public.enforce_message_limits()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  sender public.profiles%rowtype;
  lim    public.daily_limits%rowtype;
begin
  select * into sender from profiles where id = new.sender_id;
  if sender.is_premium then return new; end if;

  insert into daily_limits (user_id, limit_date)
  values (new.sender_id, current_date)
  on conflict (user_id, limit_date) do nothing;

  select * into lim from daily_limits
   where user_id = new.sender_id and limit_date = current_date for update;

  if lim.messages_sent >= 100 then
    raise exception 'DAILY_MESSAGE_LIMIT';
  end if;
  update daily_limits set messages_sent = messages_sent + 1 where id = lim.id;
  return new;
end $$;

-- Keep chat list ordering fresh
create or replace function public.touch_match_last_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update matches set last_message_at = new.created_at where id = new.match_id;
  return null;
end $$;

create trigger profiles_touch   before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger likes_limits     before insert on public.likes
  for each row execute function public.enforce_like_limits();
create trigger likes_match      after insert on public.likes
  for each row execute function public.create_match_on_mutual_like();
create trigger messages_limits  before insert on public.messages
  for each row execute function public.enforce_message_limits();
create trigger messages_touch   after insert on public.messages
  for each row execute function public.touch_match_last_message();

-- ---------- ROW LEVEL SECURITY ----------
alter table public.profiles       enable row level security;
alter table public.profile_photos enable row level security;
alter table public.likes          enable row level security;
alter table public.matches        enable row level security;
alter table public.messages       enable row level security;
alter table public.reports        enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.daily_limits   enable row level security;
alter table public.blocks         enable row level security;

-- Supabase grants everything to anon/authenticated by default. We take it back:
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

-- Column-level grants: the ONLY columns a logged-in client may ever write.
-- is_premium, is_banned, is_verified etc. are NOT listed => impossible to self-grant premium.
grant select on public.profiles to authenticated;
grant update (first_name, username, photo_url, bio, age, gender, interested_in,
              city, country, interests, onboarding_completed)
  on public.profiles to authenticated;

grant select, delete on public.profile_photos to authenticated;
grant insert (user_id, photo_url, is_primary) on public.profile_photos to authenticated;
grant update (is_primary) on public.profile_photos to authenticated;

grant select on public.likes to authenticated;
grant insert (from_user_id, to_user_id, is_super, is_pass) on public.likes to authenticated;

grant select on public.matches to authenticated;

grant select on public.messages to authenticated;
grant insert (match_id, sender_id, content) on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;

grant select on public.reports to authenticated;
grant insert (reporter_id, reported_id, reason, details) on public.reports to authenticated;

grant select on public.subscriptions to authenticated;
grant select on public.daily_limits  to authenticated;

grant select, delete on public.blocks to authenticated;
grant insert (blocker_id, blocked_id) on public.blocks to authenticated;

-- Row-level policies
create policy profiles_select on public.profiles for select to authenticated
  using (
    (not is_banned or id = auth.uid())
    and not exists (
      select 1 from public.blocks b
       where (b.blocker_id = auth.uid() and b.blocked_id = profiles.id)
          or (b.blocked_id = auth.uid() and b.blocker_id = profiles.id)
    )
  );
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy photos_select on public.profile_photos for select to authenticated
  using (moderation_status = 'approved' or user_id = auth.uid());
create policy photos_insert_own on public.profile_photos for insert to authenticated
  with check (user_id = auth.uid());
create policy photos_update_own on public.profile_photos for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy photos_delete_own on public.profile_photos for delete to authenticated
  using (user_id = auth.uid());

create policy likes_select on public.likes for select to authenticated
  using (from_user_id = auth.uid() or to_user_id = auth.uid());
create policy likes_insert on public.likes for insert to authenticated
  with check (
    from_user_id = auth.uid()
    and not exists (
      select 1 from public.blocks b
       where (b.blocker_id = auth.uid() and b.blocked_id = likes.to_user_id)
          or (b.blocked_id = auth.uid() and b.blocker_id = likes.to_user_id)
    )
  );

create policy matches_select on public.matches for select to authenticated
  using (user1_id = auth.uid() or user2_id = auth.uid());

create policy messages_select on public.messages for select to authenticated
  using (exists (
    select 1 from public.matches m
     where m.id = messages.match_id
       and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
  ));
create policy messages_insert on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
       where m.id = messages.match_id
         and m.status = 'active'
         and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );
create policy messages_mark_read on public.messages for update to authenticated
  using (sender_id <> auth.uid() and exists (
    select 1 from public.matches m
     where m.id = messages.match_id
       and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
  ))
  with check (exists (
    select 1 from public.matches m
     where m.id = messages.match_id
       and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
  ));

create policy reports_select_own on public.reports for select to authenticated
  using (reporter_id = auth.uid());
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());

create policy subscriptions_select_own on public.subscriptions for select to authenticated
  using (user_id = auth.uid());

create policy limits_select_own on public.daily_limits for select to authenticated
  using (user_id = auth.uid());

create policy blocks_select on public.blocks for select to authenticated
  using (blocker_id = auth.uid() or blocked_id = auth.uid());
create policy blocks_insert on public.blocks for insert to authenticated
  with check (blocker_id = auth.uid());
create policy blocks_delete on public.blocks for delete to authenticated
  using (blocker_id = auth.uid());

-- ---------- REALTIME (required for Phase 8 chat!) ----------
-- Without this, client subscriptions receive nothing:
alter publication supabase_realtime add table public.messages, public.matches;

-- ---------- STORAGE ----------
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy storage_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'profile-photos');
create policy storage_photos_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text   -- users upload only into /their-uuid/ folder
  );
create policy storage_photos_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );