-- FASE 8: Orçamentos
create table if not exists public.budgets (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  couple_id   uuid not null references public.couples(id),
  amount      numeric(15,2) not null check (amount >= 0),
  month       date not null,  -- primeiro dia do mês
  updated_at  timestamptz,
  updated_by  uuid references public.profiles(id),
  unique (couple_id, category_id, month)
);

-- RLS
alter table public.budgets enable row level security;

create policy "Membros gerenciam orçamentos do casal"
  on public.budgets for all
  using (
    couple_id in (
      select couple_id from public.couple_members where user_id = auth.uid()
    )
  );
