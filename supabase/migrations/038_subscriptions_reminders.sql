-- ── 038: Assinaturas, Lembretes e melhorias em Veículos ──────────────────────

-- Adiciona valor atual estimado em veículos (para patrimônio)
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS current_value numeric(15,2);

-- ── Assinaturas ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id             uuid primary key default gen_random_uuid(),
  couple_id      uuid not null references public.couples(id) on delete cascade,
  name           text not null,
  category       text not null default 'outro'
                 check (category in (
                   'streaming','música','jogos','software','saúde',
                   'academia','educação','notícias','cloud','outro'
                 )),
  cost           numeric(10,2) not null,
  billing_cycle  text not null default 'mensal'
                 check (billing_cycle in ('semanal','mensal','trimestral','semestral','anual')),
  renewal_date   date,
  color          text,
  active         boolean not null default true,
  notes          text,
  created_at     timestamptz not null default now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couple members manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
  WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));

-- ── Lembretes financeiros ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.financial_reminders (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  title       text not null,
  description text,
  due_date    date not null,
  amount      numeric(10,2),
  priority    text not null default 'media'
              check (priority in ('baixa','media','alta','urgente')),
  status      text not null default 'pendente'
              check (status in ('pendente','concluido','cancelado')),
  created_at  timestamptz not null default now()
);

ALTER TABLE public.financial_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couple members manage financial_reminders"
  ON public.financial_reminders FOR ALL
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
  WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_couple ON public.subscriptions(couple_id);
CREATE INDEX IF NOT EXISTS idx_financial_reminders_couple ON public.financial_reminders(couple_id);
CREATE INDEX IF NOT EXISTS idx_financial_reminders_due ON public.financial_reminders(due_date);
