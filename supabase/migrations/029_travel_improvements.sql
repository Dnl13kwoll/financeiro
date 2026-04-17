-- Checklist de documentos da viagem
CREATE TABLE IF NOT EXISTS public.trip_checklists (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  label      text not null,
  checked    boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Companheiros de viagem
CREATE TABLE IF NOT EXISTS public.trip_companions (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

-- Cotações comparativas (Hotel A vs Hotel B, etc.)
CREATE TABLE IF NOT EXISTS public.trip_quotes (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  category      text not null default 'hospedagem',
  description   text not null,
  provider      text,
  amount        numeric not null default 0,
  currency      text not null default 'BRL',
  exchange_rate numeric not null default 1,
  notes         text,
  chosen        boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Melhorias em trip_expenses (moeda estrangeira)
ALTER TABLE public.trip_expenses ADD COLUMN IF NOT EXISTS foreign_currency text;
ALTER TABLE public.trip_expenses ADD COLUMN IF NOT EXISTS exchange_rate    numeric not null default 1;
ALTER TABLE public.trip_expenses ADD COLUMN IF NOT EXISTS foreign_amount   numeric;

-- Melhorias em trip_places (ordenação e link Maps)
ALTER TABLE public.trip_places ADD COLUMN IF NOT EXISTS sort_order int not null default 0;
ALTER TABLE public.trip_places ADD COLUMN IF NOT EXISTS maps_url   text;

-- Viagem vinculada a uma meta
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS goal_id uuid references public.goals(id) on delete set null;

-- Transações vinculadas a uma viagem
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS trip_id uuid references public.trips(id) on delete set null;

-- RLS para novas tabelas
ALTER TABLE public.trip_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_companions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_quotes      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membro gerencia checklist" ON public.trip_checklists FOR ALL
  USING (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())));

CREATE POLICY "Membro gerencia companheiros" ON public.trip_companions FOR ALL
  USING (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())));

CREATE POLICY "Membro gerencia cotações" ON public.trip_quotes FOR ALL
  USING (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())));
