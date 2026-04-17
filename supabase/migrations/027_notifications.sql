CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  title      text not null,
  body       text,
  type       text not null default 'info' check (type in ('info', 'warning', 'error', 'success')),
  href       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membro vê notificações do casal"
  ON public.notifications FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membro atualiza notificações do casal"
  ON public.notifications FOR UPDATE
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );
