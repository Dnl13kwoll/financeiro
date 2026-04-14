-- Comentários em transações
alter table transactions add column if not exists comment text;

-- Categoria em parcelamentos
alter table installments add column if not exists category_id uuid references categories(id) on delete set null;
