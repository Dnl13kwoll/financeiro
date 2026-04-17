-- Adiciona coluna name na tabela couples (usada pelo onboarding)
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS name text;
