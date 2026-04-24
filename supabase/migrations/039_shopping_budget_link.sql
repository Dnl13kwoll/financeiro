-- Add budget_category_id to shopping_lists to link to a budget category
ALTER TABLE public.shopping_lists
  ADD COLUMN IF NOT EXISTS budget_category_id uuid references public.categories(id) on delete set null;
