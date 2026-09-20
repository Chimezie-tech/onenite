-- ============================================================
-- OneNite — Migration 009: rich profile attributes (onboarding v2)
-- ============================================================
alter table public.profiles add column if not exists orientation text;
alter table public.profiles add column if not exists relationship_status text;
alter table public.profiles add column if not exists occupation text;
alter table public.profiles add column if not exists education text;
alter table public.profiles add column if not exists religion text;
alter table public.profiles add column if not exists drinking text;
alter table public.profiles add column if not exists smoking text;
alter table public.profiles add column if not exists nightlife text;
alter table public.profiles add column if not exists politics text;
alter table public.profiles add column if not exists kids text;
alter table public.profiles add column if not exists height_cm integer;

grant update (orientation, relationship_status, occupation, education, religion,
              drinking, smoking, nightlife, politics, kids, height_cm)
  on public.profiles to authenticated;