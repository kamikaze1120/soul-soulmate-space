-- One-time data fixup for the seed "Ummah" admin account: proper display
-- name, marked verified (skips the ID-verification gate for the account
-- that's supposed to seed content everywhere), and unlimited access so the
-- UI never shows a paywall prompt to the admin.
update public.profiles
set display_name = 'Ummah Admin', is_verified = true
where id = 'c213dac5-9536-4112-9512-69a7b472e852';

insert into public.mode_entitlements (user_id, mode, is_active, is_trial, current_period_end)
values
  ('c213dac5-9536-4112-9512-69a7b472e852', 'matrimonial', true, false, null),
  ('c213dac5-9536-4112-9512-69a7b472e852', 'sisterhood', true, false, null),
  ('c213dac5-9536-4112-9512-69a7b472e852', 'brotherhood', true, false, null)
on conflict (user_id, mode) do update set is_active = true, current_period_end = null;

-- Avatar itself was uploaded directly to the profile-photos bucket via the
-- Storage REST API (not something a SQL migration can do) — this just
-- points the profile row at that already-uploaded object.
update public.profiles
set avatar_path = 'c213dac5-9536-4112-9512-69a7b472e852/logo.png'
where id = 'c213dac5-9536-4112-9512-69a7b472e852';
