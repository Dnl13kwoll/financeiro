-- Permite que qualquer usuário autenticado atualize um convite pelo token (para aceitar)
create policy "Usuário aceita convite pelo token"
  on public.invitations for update
  using (true)
  with check (status = 'accepted');

-- Permite que o membro entre no casal ao aceitar convite
create policy "Usuário entra no casal"
  on public.couple_members for insert
  with check (user_id = auth.uid());
