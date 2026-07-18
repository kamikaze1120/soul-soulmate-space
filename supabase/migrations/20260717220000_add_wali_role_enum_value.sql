-- Must run in its own migration/transaction — Postgres doesn't allow a new
-- enum value to be used (e.g. in has_role(..., 'wali') calls) in the same
-- transaction that added it.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'wali';
