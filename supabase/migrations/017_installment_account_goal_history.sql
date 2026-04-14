-- Vincular parcelamento a uma conta
alter table installments add column if not exists account_id uuid references accounts(id) on delete set null;

-- Histórico de aportes em metas
create table if not exists goal_history (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals(id) on delete cascade,
  amount numeric(12,2) not null,
  note text,
  created_at timestamptz default now()
);

alter table goal_history enable row level security;

create policy "Couple members manage goal history"
  on goal_history for all
  using (
    goal_id in (
      select id from goals
      where couple_id in (
        select couple_id from couple_members where user_id = auth.uid()
      )
    )
  );
