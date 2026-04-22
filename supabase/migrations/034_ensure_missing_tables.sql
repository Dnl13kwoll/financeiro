-- ── 034: garantir tabelas e colunas que podem não existir na produção ─────────

-- transaction_templates (criada originalmente na 021)
CREATE TABLE IF NOT EXISTS public.transaction_templates (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid references public.couples(id) on delete cascade not null,
  user_id     uuid references public.profiles(id) not null,
  name        text not null,
  type        text not null check (type in ('income', 'expense', 'transfer')),
  amount      numeric(12,2),
  description text,
  category_id uuid references public.categories(id) on delete set null,
  account_id  uuid references public.accounts(id) on delete set null,
  tags        text[] default '{}',
  created_at  timestamptz default now()
);
ALTER TABLE public.transaction_templates ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'transaction_templates' AND policyname = 'couple members manage transaction_templates'
  ) THEN
    CREATE POLICY "couple members manage transaction_templates" ON public.transaction_templates
      USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
      WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- goal_contributions (criada na 021)
CREATE TABLE IF NOT EXISTS public.goal_contributions (
  id             uuid primary key default gen_random_uuid(),
  goal_id        uuid references public.goals(id) on delete cascade not null,
  couple_id      uuid references public.couples(id) on delete cascade not null,
  user_id        uuid references public.profiles(id) not null,
  amount         numeric(12,2) not null,
  note           text,
  contributed_at date not null default current_date,
  created_at     timestamptz default now()
);
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'goal_contributions' AND policyname = 'couple members manage goal_contributions'
  ) THEN
    CREATE POLICY "couple members manage goal_contributions" ON public.goal_contributions
      USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
      WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- networth_snapshots (criada na 021)
CREATE TABLE IF NOT EXISTS public.networth_snapshots (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid references public.couples(id) on delete cascade not null,
  month       date not null,
  assets      numeric(12,2) not null default 0,
  liabilities numeric(12,2) not null default 0,
  net_worth   numeric(12,2) not null default 0,
  created_at  timestamptz default now(),
  unique(couple_id, month)
);
ALTER TABLE public.networth_snapshots ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'networth_snapshots' AND policyname = 'couple members manage networth_snapshots'
  ) THEN
    CREATE POLICY "couple members manage networth_snapshots" ON public.networth_snapshots
      USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
      WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- wishlist_votes (criada na 021)
CREATE TABLE IF NOT EXISTS public.wishlist_votes (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid references public.wishlist_items(id) on delete cascade not null,
  couple_id  uuid references public.couples(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) not null,
  approved   boolean not null default true,
  created_at timestamptz default now(),
  unique(item_id, user_id)
);
ALTER TABLE public.wishlist_votes ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wishlist_votes' AND policyname = 'couple members manage wishlist_votes'
  ) THEN
    CREATE POLICY "couple members manage wishlist_votes" ON public.wishlist_votes
      USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
      WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- notifications (criada na 021)
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid references public.couples(id) on delete cascade not null,
  user_id    uuid references public.profiles(id),
  title      text not null,
  body       text,
  type       text not null default 'info',
  href       text,
  read       boolean default false,
  created_at timestamptz default now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'users read own notifications'
  ) THEN
    CREATE POLICY "users read own notifications" ON public.notifications
      USING (
        user_id = auth.uid()
        OR (user_id IS NULL AND couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
      );
    CREATE POLICY "service can insert notifications" ON public.notifications
      FOR INSERT WITH CHECK (
        couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- card_invoice_payments (criada na 021)
CREATE TABLE IF NOT EXISTS public.card_invoice_payments (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  couple_id  uuid references public.couples(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) not null,
  amount     numeric(12,2) not null,
  paid_at    date not null default current_date,
  note       text,
  created_at timestamptz default now()
);
ALTER TABLE public.card_invoice_payments ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'card_invoice_payments' AND policyname = 'couple members manage card_invoice_payments'
  ) THEN
    CREATE POLICY "couple members manage card_invoice_payments" ON public.card_invoice_payments
      USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
      WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ── Colunas que podem não existir nas tabelas principais ─────────────────────

-- transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tags        text[] default '{}';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS comment     text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_url text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS reconciled  boolean default false;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS trip_id     uuid references public.trips(id) on delete set null;

-- accounts
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS icon  text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS min_balance_alert numeric;

-- categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color text;

-- budgets
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS alert_threshold integer default 80;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS rollover_amount  numeric default 0;

-- couples
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS daily_limit numeric;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS currency    text default 'BRL';

-- recurring_accounts
ALTER TABLE public.recurring_accounts ADD COLUMN IF NOT EXISTS category_id uuid references public.categories(id) on delete set null;
ALTER TABLE public.recurring_accounts ADD COLUMN IF NOT EXISTS end_date    date;

-- goals
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS account_id uuid references public.accounts(id) on delete set null;

-- wishlist_items
ALTER TABLE public.wishlist_items ADD COLUMN IF NOT EXISTS priority integer default 2;
ALTER TABLE public.wishlist_items ADD COLUMN IF NOT EXISTS url      text;

-- ── Index para tags (GIN) ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_tags ON public.transactions USING gin(tags);
