-- ============================================================
-- OneNite — Migration 002: Pre-onboarding defaults
-- Rows are created at first app-open, BEFORE onboarding.
-- Give age/gender safe placeholder defaults so the auth
-- insert succeeds. Onboarding overwrites both before the
-- profile ever becomes visible (discovery requires
-- onboarding_completed = true).
-- ============================================================

alter table public.profiles alter column age set default 18;
alter table public.profiles alter column gender set default 'other';