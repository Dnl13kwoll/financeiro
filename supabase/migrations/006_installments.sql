-- FASE 6: Parcelamentos
create table if not exists public.installments (
  id            uuid primary key default gen_random_uuid(),
  description   text not null,
  total_amount  numeric(15,2) not null,
  total_parts   int not null check (total_parts > 0),
  interest_rate numeric(5,4) not null default 0,
  start_date    date not null,
  status        text not null default 'active' check (status in ('active', 'paid', 'canceled')),
  user_id       uuid not null references public.profiles(id),
  couple_id     uuid not null references public.couples(id),
  created_at    timestamptz not null default now()
);

create table if not exists public.installment_items (
  id             uuid primary key default gen_random_uuid(),
  installment_id uuid not null references public.installments(id) on delete cascade,
  part_number    int not null,
  amount         numeric(15,2) not null,
  due_date       date not null,
  paid           boolean not null default false,
  paid_at        timestamptz,
  canceled       boolean not null default false,
  unique (installment_id, part_number)
);

-- RLS: installments
alter table public.installments enable row level security;

create policy "Membros gerenciam parcelamentos do casal"
  on public.installments for all
  using (
    couple_id in (
      select couple_id from public.couple_members where user_id = auth.uid()
    )
  );

-- RLS: installment_items
alter table public.installment_items enable row level security;

create policy "Membros veem items de parcelamentos do casal"
  on public.installment_items for all
  using (
    installment_id in (
      select id from public.installments
      where couple_id in (
        select couple_id from public.couple_members where user_id = auth.uid()
      )
    )
  );
