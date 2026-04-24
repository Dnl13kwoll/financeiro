-- Garante colunas adicionadas em migrations 017 e 018 que podem estar ausentes na produção
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
