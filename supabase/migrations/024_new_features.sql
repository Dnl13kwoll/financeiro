-- Color on accounts and categories
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color text;

-- Receipt URL on transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_url text;

-- Daily spending limit on couples
ALTER TABLE couples ADD COLUMN IF NOT EXISTS daily_limit numeric;

-- Compact mode preference (stored client-side, no DB needed)

-- Min balance already added in previous migration (min_balance_alert)
