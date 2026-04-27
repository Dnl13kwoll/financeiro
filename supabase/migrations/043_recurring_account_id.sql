-- Add account_id to recurring_accounts for auto-generated transactions
alter table public.recurring_accounts
  add column if not exists account_id uuid references public.accounts(id) on delete set null;
