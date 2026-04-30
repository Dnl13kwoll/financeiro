-- ── 047: Fix financial_reminders schema e budget_summary view ─────────────────

-- 1. financial_reminders: adiciona colunas que os componentes esperam
--    (o banco atual tem only done boolean, mas os componentes usam status text)
ALTER TABLE public.financial_reminders
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','concluido','cancelado')),
  ADD COLUMN IF NOT EXISTS amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'media'
    CHECK (priority IN ('baixa','media','alta','urgente'));

-- Migra done=true → status='concluido'
UPDATE public.financial_reminders SET status = 'concluido' WHERE done = true AND status = 'pendente';

-- 2. Garante que a view budget_summary existe e tem acesso correto
CREATE OR REPLACE VIEW public.budget_summary AS
SELECT
  b.couple_id,
  b.category_id,
  c.name AS category_name,
  b.month,
  b.amount AS budgeted,
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'), 0) AS spent,
  b.amount - COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'), 0) AS remaining
FROM public.budgets b
JOIN public.categories c ON c.id = b.category_id
LEFT JOIN public.transactions t
  ON t.category_id = b.category_id
  AND t.couple_id = b.couple_id
  AND DATE_TRUNC('month', t.competence_date::date) = b.month::date
  AND t.deleted_at IS NULL
GROUP BY b.id, b.couple_id, b.category_id, c.name, b.month, b.amount;

GRANT SELECT ON public.budget_summary TO authenticated;
GRANT SELECT ON public.budget_summary TO anon;
