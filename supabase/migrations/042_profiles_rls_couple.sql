-- Permite que membros do mesmo casal vejam o perfil um do outro
-- (necessário para exibir nomes em wishlist, atividades, relatórios, etc.)

-- Remove a policy restritiva antiga
DROP POLICY IF EXISTS "Usuário vê próprio perfil" ON public.profiles;

-- Nova policy: usuário vê o próprio perfil + perfis do parceiro
CREATE POLICY "Usuário vê perfis do casal"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR id IN (
      SELECT cm2.user_id
      FROM public.couple_members cm1
      JOIN public.couple_members cm2 ON cm1.couple_id = cm2.couple_id
      WHERE cm1.user_id = auth.uid()
    )
  );
