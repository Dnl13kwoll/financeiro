create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  couple_id      uuid not null references public.couples(id) on delete cascade,
  name           text not null,
  target_amount  numeric(12,2) not null,
  current_amount numeric(12,2) not null default 0,
  deadline       date,
  created_at     timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "Membros gerenciam metas"
  on public.goals for all
  using (
    couple_id in (
      select couple_id from public.couple_members where user_id = auth.uid()
    )
  );
