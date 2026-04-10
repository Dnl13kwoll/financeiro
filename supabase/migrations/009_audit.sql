-- FASE 9: Auditoria
-- Trigger para atualizar updated_at e updated_by automaticamente
create or replace function public.set_updated_fields()
returns trigger as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_transactions_updated
  before update on public.transactions
  for each row execute procedure public.set_updated_fields();

create trigger trg_budgets_updated
  before update on public.budgets
  for each row execute procedure public.set_updated_fields();

-- (Opcional) Tabela de audit log completo
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  table_name  text not null,
  record_id   uuid not null,
  action      text not null check (action in ('insert', 'update', 'delete')),
  old_data    jsonb,
  new_data    jsonb,
  user_id     uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "Apenas admins veem audit logs"
  on public.audit_logs for select
  using (auth.uid() in (
    select user_id from public.couple_members where role = 'owner'
  ));
