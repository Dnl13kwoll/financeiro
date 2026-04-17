-- Viagens
CREATE TABLE IF NOT EXISTS public.trips (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  name        text not null,
  destination text not null,
  start_date  date,
  end_date    date,
  budget      numeric not null default 0,
  currency    text not null default 'BRL',
  status      text not null default 'planning' check (status in ('planning', 'confirmed', 'completed', 'cancelled')),
  notes       text,
  created_at  timestamptz not null default now()
);

-- Itens de orçamento da viagem (hotel, carro, passeio, etc.)
CREATE TABLE IF NOT EXISTS public.trip_expenses (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  category    text not null default 'outros' check (category in ('hospedagem', 'transporte', 'passeios', 'alimentacao', 'compras', 'documentos', 'outros')),
  description text not null,
  estimated   numeric not null default 0,
  actual      numeric,
  paid        boolean not null default false,
  notes       text,
  created_at  timestamptz not null default now()
);

-- Destinos / locais para visitar
CREATE TABLE IF NOT EXISTS public.trip_places (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  name        text not null,
  type        text not null default 'tourist' check (type in ('tourist', 'restaurant', 'hotel', 'transport', 'other')),
  address     text,
  notes       text,
  status      text not null default 'wishlist' check (status in ('wishlist', 'confirmed', 'visited')),
  created_at  timestamptz not null default now()
);

-- RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membro vê viagens do casal"
  ON public.trips FOR ALL
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));

CREATE POLICY "Membro gerencia gastos da viagem"
  ON public.trip_expenses FOR ALL
  USING (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())));

CREATE POLICY "Membro gerencia locais da viagem"
  ON public.trip_places FOR ALL
  USING (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())));
