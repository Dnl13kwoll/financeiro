create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date date,
  category text,
  tags text[] not null default '{}',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.tasks enable row level security;

create policy "couple members can select tasks"
  on public.tasks for select
  using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = tasks.couple_id
        and couple_members.user_id = auth.uid()
    )
  );

create policy "couple members can insert tasks"
  on public.tasks for insert
  with check (
    auth.uid() = created_by and
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = tasks.couple_id
        and couple_members.user_id = auth.uid()
    )
  );

create policy "couple members can update tasks"
  on public.tasks for update
  using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = tasks.couple_id
        and couple_members.user_id = auth.uid()
    )
  );

create policy "couple members can delete tasks"
  on public.tasks for delete
  using (
    auth.uid() = created_by or
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = tasks.couple_id
        and couple_members.user_id = auth.uid()
    )
  );

create index if not exists tasks_couple_id_idx on public.tasks(couple_id);
create index if not exists tasks_assigned_to_idx on public.tasks(assigned_to);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_due_date_idx on public.tasks(due_date);
