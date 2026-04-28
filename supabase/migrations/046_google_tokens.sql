create table if not exists public.google_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  token_expiry timestamptz,
  google_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique(user_id)
);

alter table public.google_tokens enable row level security;

create policy "users can manage own google tokens"
  on public.google_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
