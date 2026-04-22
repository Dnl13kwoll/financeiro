-- ── 035: Investimentos ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.investments (
  id               uuid primary key default gen_random_uuid(),
  couple_id        uuid not null references public.couples(id) on delete cascade,
  created_by       uuid references public.profiles(id) on delete set null,
  name             text not null,
  type             text not null default 'outro' check (type in (
    'cdb','lci','lca','poupanca',
    'tesouro_selic','tesouro_ipca','tesouro_pre',
    'acoes','fii','etf','bdr',
    'fundo_di','fundo_multi','fundo_acoes',
    'pgbl','vgbl',
    'cripto','outro'
  )),
  institution      text,
  invested_amount  numeric(15,2) not null default 0,
  current_value    numeric(15,2),
  rate_type        text check (rate_type in ('pct_cdi','ipca_plus','fixed','selic','other')),
  rate_value       numeric(8,4),
  maturity_date    date,
  start_date       date not null default current_date,
  liquidity        text,
  goal_id          uuid references public.goals(id) on delete set null,
  notes            text,
  active           boolean not null default true,
  last_updated_at  date,
  created_at       timestamptz not null default now()
);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couple members manage investments"
  ON public.investments FOR ALL
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
  WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
