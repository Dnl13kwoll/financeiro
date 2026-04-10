-- FASE 2: Casal
create table if not exists public.couples (
  id         uuid primary key default gen_random_uuid(),
  currency   text not null default 'BRL',
  created_at timestamptz not null default now()
);

create table if not exists public.couple_members (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  unique (user_id, couple_id)
);

create table if not exists public.invitations (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  email      text not null,
  token      uuid not null default gen_random_uuid(),
  status     text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  unique (couple_id, email)
);

-- RLS: couples
alter table public.couples enable row level security;

create policy "Membro vê o casal"
  on public.couples for select
  using (
    id in (
      select couple_id from public.couple_members where user_id = auth.uid()
    )
  );

-- RLS: couple_members
alter table public.couple_members enable row level security;

create policy "Membro vê membros do casal"
  on public.couple_members for select
  using (
    couple_id in (
      select couple_id from public.couple_members where user_id = auth.uid()
    )
  );

-- RLS: invitations
alter table public.invitations enable row level security;

create policy "Dono gerencia convites"
  on public.invitations for all
  using (
    couple_id in (
      select couple_id from public.couple_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

create policy "Convidado vê convite pelo token"
  on public.invitations for select
  using (true); -- filtrado por token na aplicação
