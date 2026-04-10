-- FASE 7: Recorrentes
create table if not exists public.recurring_accounts (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  day_due   int not null check (day_due between 1 and 31),
  user_id   uuid not null references public.profiles(id),
  couple_id uuid not null references public.couples(id),
  active    boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_records (
  id              uuid primary key default gen_random_uuid(),
  recurring_id    uuid not null references public.recurring_accounts(id) on delete cascade,
  reference_month date not null,  -- primeiro dia do mês de referência
  amount          numeric(15,2) not null,
  paid            boolean not null default false,
  paid_at         timestamptz,
  unique (recurring_id, reference_month)
);

-- RLS: recurring_accounts
alter table public.recurring_accounts enable row level security;

create policy "Membros gerenciam recorrentes do casal"
  on public.recurring_accounts for all
  using (
    couple_id in (
      select couple_id from public.couple_members where user_id = auth.uid()
    )
  );

-- RLS: recurring_records
alter table public.recurring_records enable row level security;

create policy "Membros veem registros de recorrentes do casal"
  on public.recurring_records for all
  using (
    recurring_id in (
      select id from public.recurring_accounts
      where couple_id in (
        select couple_id from public.couple_members where user_id = auth.uid()
      )
    )
  );
