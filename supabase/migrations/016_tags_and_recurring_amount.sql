-- Tags nas transações
alter table transactions add column if not exists tags text[] default '{}';
create index if not exists idx_transactions_tags on transactions using gin(tags);

-- Valor padrão em recorrentes
alter table recurring_accounts add column if not exists amount numeric(12,2) default null;
