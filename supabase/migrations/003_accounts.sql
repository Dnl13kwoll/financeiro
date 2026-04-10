-- FASE 3: Contas
create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  type            text not null check (type in ('cash', 'bank', 'credit_card')),
  initial_balance numeric(15,2) not null default 0,
  limit_amount    numeric(15,2),
  closing_day     int check (closing_day between 1 and 31),
  due_day         int check (due_day between 1 and 31),
  user_id         uuid not null references public.profiles(id),
  couple_id       uuid not null references public.couples(id),
  deleted_at      timestamptz,
  created_at      timestamptz not null default now()
);

-- RLS
alter table public.accounts enable row level security;

create policy "Membros do casal veem e gerenciam contas"
  on public.accounts for all
  using (
    deleted_at is null
    and couple_id in (
      select couple_id from public.couple_members where user_id = auth.uid()
    )
  );
