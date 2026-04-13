-- Adiciona suporte a categorias personalizadas por casal
alter table public.categories
  add column if not exists couple_id uuid references public.couples(id) on delete cascade;

-- Permite membros do casal criar/excluir categorias personalizadas
create policy "Membros gerenciam categorias do casal"
  on public.categories for all
  using (
    couple_id is null
    or couple_id in (
      select couple_id from public.couple_members where user_id = auth.uid()
    )
  );

-- Permite que qualquer usuário autenticado leia categorias padrão
create policy "Todos leem categorias"
  on public.categories for select
  using (true);

-- Permite membro sair do casal
create policy "Membro pode sair do casal"
  on public.couple_members for delete
  using (user_id = auth.uid());
