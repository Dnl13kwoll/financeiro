-- Permite que qualquer usuário autenticado crie um casal
create policy "Usuário cria casal"
  on public.couples for insert
  to authenticated
  with check (true);

-- Permite que um usuário se adicione como membro de um casal
-- (apenas pode inserir linha com seu próprio user_id)
create policy "Usuário entra em casal"
  on public.couple_members for insert
  to authenticated
  with check (user_id = auth.uid());

-- Permite que o dono do casal adicione outros membros
create policy "Dono adiciona membros"
  on public.couple_members for insert
  to authenticated
  with check (
    couple_id in (
      select couple_id from public.couple_members
      where user_id = auth.uid() and role = 'owner'
    )
  );
