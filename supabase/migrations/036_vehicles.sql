-- ── 036: Veículos e Manutenções ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vehicles (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  created_by  uuid references public.profiles(id) on delete set null,
  name        text not null,
  make        text,
  model       text,
  year        int,
  plate       text,
  color       text,
  fuel_type   text not null default 'flex'
              check (fuel_type in ('gasolina','etanol','flex','diesel','gnv','elétrico','híbrido')),
  current_km  int not null default 0,
  notes       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couple members manage vehicles"
  ON public.vehicles FOR ALL
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
  WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vehicle_maintenances (
  id             uuid primary key default gen_random_uuid(),
  vehicle_id     uuid not null references public.vehicles(id) on delete cascade,
  couple_id      uuid not null references public.couples(id) on delete cascade,
  type           text not null,
  description    text,
  date           date not null,
  km_at_service  int,
  cost           numeric(10,2),
  shop           text,
  next_km        int,
  next_date      date,
  notes          text,
  created_at     timestamptz not null default now()
);

ALTER TABLE public.vehicle_maintenances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couple members manage vehicle maintenances"
  ON public.vehicle_maintenances FOR ALL
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
  WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));

-- Índices
CREATE INDEX IF NOT EXISTS idx_vehicles_couple ON public.vehicles(couple_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_vehicle ON public.vehicle_maintenances(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_couple ON public.vehicle_maintenances(couple_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_date ON public.vehicle_maintenances(date DESC);
