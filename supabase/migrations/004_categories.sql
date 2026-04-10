-- FASE 4: Categorias
create table if not exists public.categories (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  type      text not null check (type in ('income', 'expense')),
  is_system boolean not null default false,
  couple_id uuid references public.couples(id) on delete cascade
);

-- Categorias padrão do sistema
insert into public.categories (name, type, is_system) values
  ('Salário', 'income', true),
  ('Freelance', 'income', true),
  ('Investimentos', 'income', true),
  ('Outros (entrada)', 'income', true),
  ('Alimentação', 'expense', true),
  ('Moradia', 'expense', true),
  ('Transporte', 'expense', true),
  ('Saúde', 'expense', true),
  ('Educação', 'expense', true),
  ('Lazer', 'expense', true),
  ('Vestuário', 'expense', true),
  ('Assinaturas', 'expense', true),
  ('Outros (saída)', 'expense', true);

-- RLS
alter table public.categories enable row level security;

create policy "Categorias do sistema visíveis para todos"
  on public.categories for select
  using (
    is_system = true
    or couple_id in (
      select couple_id from public.couple_members where user_id = auth.uid()
    )
  );

create policy "Casal gerencia próprias categorias"
  on public.categories for insert
  with check (
    couple_id in (
      select couple_id from public.couple_members where user_id = auth.uid()
    )
  );

create policy "Casal atualiza/deleta próprias categorias"
  on public.categories for all
  using (
    is_system = false
    and couple_id in (
      select couple_id from public.couple_members where user_id = auth.uid()
    )
  );
