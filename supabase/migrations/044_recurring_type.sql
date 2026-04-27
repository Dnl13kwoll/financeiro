-- Add type column to recurring_accounts (expense | income)
alter table public.recurring_accounts
  add column if not exists type text not null default 'expense'
  check (type in ('expense', 'income'));
