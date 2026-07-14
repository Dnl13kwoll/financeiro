-- Adiciona política de DELETE em couple_members
-- Sem ela, o botão "Sair do casal" falhava silenciosamente:
-- o RLS bloqueava o DELETE sem retornar erro, e o usuário
-- continuava no casal sem saber.

CREATE POLICY "Membro pode sair do casal"
  ON public.couple_members FOR DELETE
  USING (user_id = auth.uid());
