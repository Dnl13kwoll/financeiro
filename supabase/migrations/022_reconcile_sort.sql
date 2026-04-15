-- Add reconciled flag to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reconciled boolean default false;

-- Add sort_order to categories for custom ordering
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order integer default 0;
