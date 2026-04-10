-- FASE 5: Transações
create table if not exists public.transactions (
  id                  uuid primary key default gen_random_uuid(),
  type                text not null check (type in ('income', 'expense', 'transfer')),
  amount              numeric(15,2) not null check (amount > 0),
  description         text,
  category_id         uuid references public.categories(id),
  account_id          uuid not null references public.accounts(id),
  to_account_id       uuid references public.accounts(id),
  installment_item_id uuid references public.installment_items(id),
  date                date not null default current_date,
  competence_date     date not null default current_date,
  is_private          boolean not null default false,
  user_id             uuid not null references public.profiles(id),
  couple_id           uuid not null references public.couples(id),
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz,
  updated_by          uuid references public.profiles(id),

  -- Transferência não pode ser para a mesma conta
  constraint transfer_different_accounts check (
    type != 'transfer' or account_id != to_account_id
  )
);

-- RLS
alter table public.transactions enable row level security;

create policy "Membros veem transações do casal (exceto privadas de outros)"
  on public.transactions for select
  using (
    deleted_at is null
    and couple_id in (
      select couple_id from public.couple_members where user_id = auth.uid()
    )
    and (is_private = false or user_id = auth.uid())
  );

create policy "Membros inserem transações"
  on public.transactions for insert
  with check (
    couple_id in (
      select couple_id from public.couple_members where user_id = auth.uid()
    )
  );

create policy "Membros atualizam/deletam próprias transações"
  on public.transactions for update
  using (
    couple_id in (
      select couple_id from public.couple_members where user_id = auth.uid()
    )
  );

create policy "Membros deletam transações"
  on public.transactions for delete
  using (
    couple_id in (
      select couple_id from public.couple_members where user_id = auth.uid()
    )
  );
