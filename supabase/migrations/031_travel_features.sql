-- Add booking_ref to expenses
ALTER TABLE public.trip_expenses ADD COLUMN IF NOT EXISTS booking_ref text;

-- Add fields to trips
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS budget_limits jsonb NOT NULL DEFAULT '{}';

-- Link itinerary item to a place
ALTER TABLE public.trip_itinerary ADD COLUMN IF NOT EXISTS place_id uuid REFERENCES public.trip_places(id) ON DELETE SET NULL;

-- Daily diary
CREATE TABLE IF NOT EXISTS public.trip_diary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_date date NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(trip_id, day_date)
);
ALTER TABLE public.trip_diary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membro gerencia diário" ON public.trip_diary FOR ALL
  USING (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())));

-- Share tokens
CREATE TABLE IF NOT EXISTS public.trip_share_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trip_share_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público lê tokens" ON public.trip_share_tokens FOR SELECT USING (true);
CREATE POLICY "Membro gerencia tokens" ON public.trip_share_tokens FOR INSERT
  WITH CHECK (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())));

-- Attachments
CREATE TABLE IF NOT EXISTS public.trip_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  size_bytes int,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trip_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membro gerencia anexos" ON public.trip_attachments FOR ALL
  USING (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())));
