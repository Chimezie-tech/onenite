-- ============================================================
-- OneNite — Migration 003: Shop & Ads (monetization layer #2)
-- ============================================================

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  price       numeric(10,2) not null check (price >= 0),
  currency    text not null default 'NGN',
  image_url   text not null,
  cta_label   text not null default 'Buy Now',
  cta_url     text,                          -- external checkout (WhatsApp, Paystack link...)
  status      text not null default 'active' check (status in ('active','sold_out','archived')),
  created_at  timestamptz not null default now()
);

create table public.ads (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text not null default '',
  image_url   text not null,
  cta_label   text not null default 'Learn More',
  cta_type    text not null default 'external' check (cta_type in ('internal','external')),
  cta_url     text not null,                 -- '/shop/xxx' (internal) or 'https://...' (external)
  placements  text[] not null default '{home}',  -- home | chat | profile
  status      text not null default 'active' check (status in ('draft','active','paused')),
  starts_at   timestamptz not null default now(),
  expires_at  timestamptz,
  impressions integer not null default 0,
  clicks      integer not null default 0,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index products_active_idx on public.products (created_at desc) where status = 'active';
create index ads_active_idx on public.ads (sort_order) where status = 'active';

-- Atomic counter bump for impressions/clicks
create or replace function public.track_ad(ad_id uuid, event text)
returns void language sql security definer set search_path = public as $$
  update public.ads set
    clicks      = clicks      + (case when event = 'click' then 1 else 0 end),
    impressions = impressions + (case when event = 'impression' then 1 else 0 end)
  where id = ad_id;
$$;

-- ---------- RLS ----------
alter table public.products enable row level security;
alter table public.ads enable row level security;

revoke all on public.products from anon, authenticated;
revoke all on public.ads from anon, authenticated;

grant select on public.products to authenticated;
grant select on public.ads to authenticated;
grant execute on function public.track_ad(uuid, text) to authenticated;

-- Users only ever see live products / live, unexpired ads.
-- Writes happen ONLY through admin API routes (service role).
create policy products_select_active on public.products for select to authenticated
  using (status = 'active');

create policy ads_select_active on public.ads for select to authenticated
  using (status = 'active' and starts_at <= now() and (expires_at is null or expires_at > now()));