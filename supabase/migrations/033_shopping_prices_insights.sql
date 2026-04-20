-- ── Lista de compras ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  name       text not null default 'Lista de compras',
  budget     numeric,
  completed  boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.shopping_items (
  id             uuid primary key default gen_random_uuid(),
  list_id        uuid not null references public.shopping_lists(id) on delete cascade,
  name           text not null,
  quantity       numeric not null default 1,
  unit           text,
  estimated_price numeric,
  actual_price   numeric,
  checked        boolean not null default false,
  category       text,
  notes          text,
  added_by       uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couple members can manage shopping lists"
  ON public.shopping_lists FOR ALL
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));

CREATE POLICY "couple members can manage shopping items"
  ON public.shopping_items FOR ALL
  USING (list_id IN (
    SELECT sl.id FROM public.shopping_lists sl
    JOIN public.couple_members cm ON cm.couple_id = sl.couple_id
    WHERE cm.user_id = auth.uid()
  ));

-- ── Histórico de preços ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.price_history (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  item_name  text not null,
  category   text,
  price      numeric not null,
  quantity   numeric not null default 1,
  unit       text,
  store      text,
  notes      text,
  recorded_at date not null default current_date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couple members can manage price history"
  ON public.price_history FOR ALL
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()));
