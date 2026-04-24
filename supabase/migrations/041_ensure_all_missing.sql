-- 041: garante todas as colunas e tabelas que podem estar ausentes em produção

-- Migration 016: tags em transações
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.recurring_accounts ADD COLUMN IF NOT EXISTS amount numeric(12,2) DEFAULT NULL;

-- Migration 017: account_id em installments
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

-- Migration 018: comment em transações, category_id em installments
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS comment text;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Migration 019: melhorias diversas
ALTER TABLE public.recurring_accounts ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.recurring_accounts ADD COLUMN IF NOT EXISTS paused boolean NOT NULL DEFAULT false;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS split_id uuid;

-- Migration 020: melhorias em accounts e recurring
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS min_balance_alert numeric(12,2) DEFAULT NULL;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.recurring_accounts ADD COLUMN IF NOT EXISTS end_date date DEFAULT NULL;

-- Migration 021: color e icon em accounts, alert_threshold em budgets
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS color text DEFAULT NULL;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS icon text DEFAULT NULL;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS alert_threshold integer DEFAULT 80;

-- Migration 022: reconciled em transactions, sort_order em categories
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS reconciled boolean DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Migration 024: color em accounts/categories, receipt_url em transactions, daily_limit em couples, notes em accounts
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS color text DEFAULT NULL;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_url text;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS daily_limit numeric DEFAULT NULL;

-- Migration 026: nome do casal
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS name text;

-- Tabela wishlist_votes (migration 021/034)
CREATE TABLE IF NOT EXISTS public.wishlist_votes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    uuid REFERENCES public.wishlist_items(id) ON DELETE CASCADE NOT NULL,
  couple_id  uuid REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES public.profiles(id) NOT NULL,
  approved   boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_id, user_id)
);
ALTER TABLE public.wishlist_votes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wishlist_votes' AND policyname = 'couple members manage wishlist_votes') THEN
    CREATE POLICY "couple members manage wishlist_votes" ON public.wishlist_votes
      USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
      WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Tabela transaction_templates (migration 021/034)
CREATE TABLE IF NOT EXISTS public.transaction_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   uuid REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES public.profiles(id) NOT NULL,
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('income','expense','transfer')),
  amount      numeric(12,2),
  description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id  uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  tags        text[] DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.transaction_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_templates' AND policyname = 'couple members manage transaction_templates') THEN
    CREATE POLICY "couple members manage transaction_templates" ON public.transaction_templates
      USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
      WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Tabela networth_snapshots (migration 021)
CREATE TABLE IF NOT EXISTS public.networth_snapshots (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id  uuid REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  net_worth  numeric(15,2) NOT NULL,
  assets     numeric(15,2) NOT NULL DEFAULT 0,
  liabilities numeric(15,2) NOT NULL DEFAULT 0,
  snapshot_date date NOT NULL DEFAULT current_date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.networth_snapshots ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'networth_snapshots' AND policyname = 'couple members manage networth_snapshots') THEN
    CREATE POLICY "couple members manage networth_snapshots" ON public.networth_snapshots
      USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
      WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Tabela category_rules (migration 023)
CREATE TABLE IF NOT EXISTS public.category_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   uuid REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  pattern     text NOT NULL,
  match_type  text NOT NULL DEFAULT 'contains' CHECK (match_type IN ('contains','starts_with','ends_with','exact')),
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.category_rules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'category_rules' AND policyname = 'couple members manage category_rules') THEN
    CREATE POLICY "couple members manage category_rules" ON public.category_rules
      USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
      WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Tabela financial_reminders (migration 038)
CREATE TABLE IF NOT EXISTS public.financial_reminders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   uuid REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES public.profiles(id) NOT NULL,
  title       text NOT NULL,
  description text,
  due_date    date,
  recurrence  text DEFAULT 'once',
  done        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.financial_reminders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'financial_reminders' AND policyname = 'couple members manage financial_reminders') THEN
    CREATE POLICY "couple members manage financial_reminders" ON public.financial_reminders
      USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
      WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;
END $$;
