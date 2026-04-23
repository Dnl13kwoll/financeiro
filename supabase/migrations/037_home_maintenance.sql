-- ── 037: Imóveis e Manutenções Residenciais ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.properties (
  id               uuid primary key default gen_random_uuid(),
  couple_id        uuid not null references public.couples(id) on delete cascade,
  created_by       uuid references public.profiles(id) on delete set null,
  name             text not null,
  type             text not null default 'casa'
                   check (type in ('casa','apartamento','terreno','comercial','sitio','chacara','outro')),
  address          text,
  area_m2          numeric(10,2),
  purchase_date    date,
  purchase_value   numeric(15,2),
  current_value    numeric(15,2),
  condo_fee        numeric(10,2),
  iptu_annual      numeric(10,2),
  notes            text,
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couple members manage properties"
  ON public.properties FOR ALL
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
  WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.property_maintenances (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  couple_id    uuid not null references public.couples(id) on delete cascade,
  type         text not null,
  description  text,
  date         date not null,
  cost         numeric(10,2),
  contractor   text,
  status       text not null default 'concluido'
               check (status in ('concluido','agendado','orcamento')),
  priority     text not null default 'media'
               check (priority in ('baixa','media','alta','urgente')),
  next_date    date,
  warranty_until date,
  notes        text,
  created_at   timestamptz not null default now()
);

ALTER TABLE public.property_maintenances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couple members manage property maintenances"
  ON public.property_maintenances FOR ALL
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()))
  WITH CHECK (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));

-- Índices
CREATE INDEX IF NOT EXISTS idx_properties_couple ON public.properties(couple_id);
CREATE INDEX IF NOT EXISTS idx_property_maintenances_property ON public.property_maintenances(property_id);
CREATE INDEX IF NOT EXISTS idx_property_maintenances_couple ON public.property_maintenances(couple_id);
CREATE INDEX IF NOT EXISTS idx_property_maintenances_date ON public.property_maintenances(date DESC);
CREATE INDEX IF NOT EXISTS idx_property_maintenances_next ON public.property_maintenances(next_date);
