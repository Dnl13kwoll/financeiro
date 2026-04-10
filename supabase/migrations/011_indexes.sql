-- FASE 19: Índices para performance
create index if not exists idx_transactions_couple_date
  on public.transactions (couple_id, competence_date)
  where deleted_at is null;

create index if not exists idx_transactions_account
  on public.transactions (account_id)
  where deleted_at is null;

create index if not exists idx_transactions_to_account
  on public.transactions (to_account_id)
  where deleted_at is null and to_account_id is not null;

create index if not exists idx_transactions_category
  on public.transactions (category_id, couple_id, competence_date)
  where deleted_at is null;

create index if not exists idx_couple_members_user
  on public.couple_members (user_id);

create index if not exists idx_couple_members_couple
  on public.couple_members (couple_id);

create index if not exists idx_installments_couple
  on public.installments (couple_id);

create index if not exists idx_installment_items_installment
  on public.installment_items (installment_id);

create index if not exists idx_recurring_couple
  on public.recurring_accounts (couple_id)
  where active = true;

create index if not exists idx_recurring_records_month
  on public.recurring_records (recurring_id, reference_month);

create index if not exists idx_budgets_couple_month
  on public.budgets (couple_id, month);

create index if not exists idx_invitations_token
  on public.invitations (token)
  where status = 'pending';
