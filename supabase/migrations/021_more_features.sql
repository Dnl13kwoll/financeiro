-- 021: more features

-- goal_contributions: track each deposit to a goal
create table if not exists goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals(id) on delete cascade not null,
  couple_id uuid references couples(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  amount numeric(12,2) not null,
  note text,
  contributed_at date not null default current_date,
  created_at timestamptz default now()
);
alter table goal_contributions enable row level security;
create policy "couple members manage goal_contributions" on goal_contributions
  using (couple_id in (select couple_id from couple_members where user_id = auth.uid()))
  with check (couple_id in (select couple_id from couple_members where user_id = auth.uid()));

-- networth_snapshots: monthly net worth history
create table if not exists networth_snapshots (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade not null,
  month date not null,
  assets numeric(12,2) not null default 0,
  liabilities numeric(12,2) not null default 0,
  net_worth numeric(12,2) not null default 0,
  created_at timestamptz default now(),
  unique(couple_id, month)
);
alter table networth_snapshots enable row level security;
create policy "couple members manage networth_snapshots" on networth_snapshots
  using (couple_id in (select couple_id from couple_members where user_id = auth.uid()))
  with check (couple_id in (select couple_id from couple_members where user_id = auth.uid()));

-- wishlist_votes: each partner approves/rejects items
create table if not exists wishlist_votes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references wishlist_items(id) on delete cascade not null,
  couple_id uuid references couples(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  approved boolean not null default true,
  created_at timestamptz default now(),
  unique(item_id, user_id)
);
alter table wishlist_votes enable row level security;
create policy "couple members manage wishlist_votes" on wishlist_votes
  using (couple_id in (select couple_id from couple_members where user_id = auth.uid()))
  with check (couple_id in (select couple_id from couple_members where user_id = auth.uid()));

-- transaction_templates: saved quick-add presets
create table if not exists transaction_templates (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  name text not null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric(12,2),
  description text,
  category_id uuid references categories(id) on delete set null,
  account_id uuid references accounts(id) on delete set null,
  tags text[] default '{}',
  created_at timestamptz default now()
);
alter table transaction_templates enable row level security;
create policy "couple members manage transaction_templates" on transaction_templates
  using (couple_id in (select couple_id from couple_members where user_id = auth.uid()))
  with check (couple_id in (select couple_id from couple_members where user_id = auth.uid()));

-- in-app notifications log
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade not null,
  user_id uuid references profiles(id),
  title text not null,
  body text,
  type text not null default 'info',
  href text,
  read boolean default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
create policy "users read own notifications" on notifications
  using (
    user_id = auth.uid()
    or (user_id is null and couple_id in (select couple_id from couple_members where user_id = auth.uid()))
  );
create policy "service can insert notifications" on notifications
  for insert with check (
    couple_id in (select couple_id from couple_members where user_id = auth.uid())
  );

-- accounts: color + icon
alter table accounts add column if not exists color text default null;
alter table accounts add column if not exists icon text default null;

-- budgets: configurable alert threshold (%)
alter table budgets add column if not exists alert_threshold integer default 80;

-- card_invoice_payments
create table if not exists card_invoice_payments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade not null,
  couple_id uuid references couples(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  amount numeric(12,2) not null,
  paid_at date not null default current_date,
  note text,
  created_at timestamptz default now()
);
alter table card_invoice_payments enable row level security;
create policy "couple members manage card_invoice_payments" on card_invoice_payments
  using (couple_id in (select couple_id from couple_members where user_id = auth.uid()))
  with check (couple_id in (select couple_id from couple_members where user_id = auth.uid()));
