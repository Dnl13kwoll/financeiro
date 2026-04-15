-- 020: extra features
-- accounts: low-balance alert threshold + manual sort order
alter table accounts add column if not exists min_balance_alert numeric(12,2) default null;
alter table accounts add column if not exists sort_order integer default 0;

-- recurring_accounts: optional end date
alter table recurring_accounts add column if not exists end_date date default null;

-- wishlist items
create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  name text not null,
  description text,
  url text,
  price numeric(12,2),
  priority smallint default 2, -- 1=high, 2=medium, 3=low
  purchased boolean default false,
  purchased_at timestamptz,
  created_at timestamptz default now()
);
alter table wishlist_items enable row level security;
create policy "couple members manage wishlist" on wishlist_items
  using (couple_id in (select couple_id from couple_members where user_id = auth.uid()))
  with check (couple_id in (select couple_id from couple_members where user_id = auth.uid()));

-- monthly plans (zero-base budgeting by income category)
create table if not exists monthly_plans (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade not null,
  month date not null, -- first day of month
  category_id uuid references categories(id) on delete cascade,
  label text not null,
  planned_amount numeric(12,2) not null default 0,
  created_at timestamptz default now(),
  unique(couple_id, month, label)
);
alter table monthly_plans enable row level security;
create policy "couple members manage monthly_plans" on monthly_plans
  using (couple_id in (select couple_id from couple_members where user_id = auth.uid()))
  with check (couple_id in (select couple_id from couple_members where user_id = auth.uid()));
