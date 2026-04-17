-- Notas gerais da viagem
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS notes text;

-- Itinerário por dia
CREATE TABLE IF NOT EXISTS public.trip_itinerary (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  day_date    date not null,
  time_slot   text,
  title       text not null,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

ALTER TABLE public.trip_itinerary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membro gerencia itinerário" ON public.trip_itinerary FOR ALL
  USING (trip_id IN (
    SELECT id FROM public.trips
    WHERE couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  ));
