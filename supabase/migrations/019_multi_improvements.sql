-- Recurring accounts: category + paused
alter table recurring_accounts add column if not exists category_id uuid references categories(id) on delete set null;
alter table recurring_accounts add column if not exists paused boolean not null default false;

-- Goals: link to account
alter table goals add column if not exists account_id uuid references accounts(id) on delete set null;

-- Transaction splits (50/50 or custom ratio)
create table if not exists transaction_splits (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  ratio numeric(5,4) not null default 0.5000,
  note text,
  created_at timestamptz default now()
);
alter table transaction_splits enable row level security;
create policy "couple members can manage transaction_splits" on transaction_splits
  for all
  using (
    transaction_id in (
      select id from transactions
      where couple_id in (
        select couple_id from couple_members where user_id = auth.uid()
      )
    )
  )
  with check (
    transaction_id in (
      select id from transactions
      where couple_id in (
        select couple_id from couple_members where user_id = auth.uid()
      )
    )
  );

-- Activity log
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  user_id uuid not null,
  action text not null,
  entity_type text,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz default now()
);
alter table activity_log enable row level security;
create policy "couple members can view activity_log" on activity_log
  for select using (
    couple_id in (select couple_id from couple_members where user_id = auth.uid())
  );
create policy "users can insert activity_log" on activity_log
  for insert with check (user_id = auth.uid());

-- Add split_id to transactions for easy lookup
alter table transactions add column if not exists split_id uuid references transaction_splits(id) on delete set null;
