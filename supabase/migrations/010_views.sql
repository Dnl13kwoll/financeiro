-- FASE 10: View de saldo dinâmico (sem drift)
create or replace view public.account_balances as
select
  a.id,
  a.name,
  a.type,
  a.couple_id,
  coalesce(sum(
    case
      when t.type = 'income'                              then t.amount
      when t.type = 'expense'                             then -t.amount
      when t.type = 'transfer' and t.account_id = a.id   then -t.amount
      when t.type = 'transfer' and t.to_account_id = a.id then t.amount
      else 0
    end
  ), 0) + a.initial_balance as balance
from public.accounts a
left join public.transactions t
  on (t.account_id = a.id or t.to_account_id = a.id)
  and t.deleted_at is null
where a.deleted_at is null
group by a.id, a.name, a.type, a.couple_id, a.initial_balance;

-- View de disponível por categoria no mês
create or replace view public.budget_summary as
select
  b.couple_id,
  b.category_id,
  c.name as category_name,
  b.month,
  b.amount as budgeted,
  coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as spent,
  b.amount - coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as remaining
from public.budgets b
join public.categories c on c.id = b.category_id
left join public.transactions t
  on t.category_id = b.category_id
  and t.couple_id = b.couple_id
  and date_trunc('month', t.competence_date) = b.month
  and t.deleted_at is null
group by b.id, b.couple_id, b.category_id, c.name, b.month, b.amount;
