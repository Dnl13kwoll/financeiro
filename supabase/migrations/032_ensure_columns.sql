-- Garante que a tabela goals existe (caso migration 013 não tenha sido executada)
CREATE TABLE IF NOT EXISTS public.goals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id      uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  name           text NOT NULL,
  target_amount  numeric(12,2) NOT NULL,
  current_amount numeric(12,2) NOT NULL DEFAULT 0,
  deadline       date,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Colunas adicionais da goals (migrations 019/020)
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- RLS para goals (idempotente)
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Membros gerenciam metas') THEN
    CREATE POLICY "Membros gerenciam metas" ON public.goals FOR ALL
      USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- goal_contributions (migration 020)
CREATE TABLE IF NOT EXISTS public.goal_contributions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id        uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  couple_id      uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  amount         numeric(12,2) NOT NULL,
  contributed_by uuid REFERENCES public.profiles(id),
  contributed_at timestamptz NOT NULL DEFAULT now(),
  note           text
);
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goal_contributions' AND policyname = 'Membros gerenciam contribuições') THEN
    CREATE POLICY "Membros gerenciam contribuições" ON public.goal_contributions FOR ALL
      USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- goal_history (migration 017)
CREATE TABLE IF NOT EXISTS public.goal_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id    uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  amount     numeric(12,2) NOT NULL,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.goal_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goal_history' AND policyname = 'Membros leem histórico') THEN
    CREATE POLICY "Membros leem histórico" ON public.goal_history FOR ALL
      USING (goal_id IN (SELECT id FROM public.goals WHERE couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())));
  END IF;
END $$;

-- Garante coluna alert_threshold na tabela budgets (migration 021)
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS alert_threshold integer DEFAULT 80;
