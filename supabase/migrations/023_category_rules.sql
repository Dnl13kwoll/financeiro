-- Category rules for auto-categorization
CREATE TABLE IF NOT EXISTS category_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
  pattern text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  match_type text NOT NULL DEFAULT 'contains', -- 'contains' | 'starts_with' | 'exact'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_category_rules_couple ON category_rules(couple_id);
