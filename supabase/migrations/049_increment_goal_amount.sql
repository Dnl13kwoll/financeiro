-- Atomic increment for goals.current_amount — avoids read-modify-write race between partners
CREATE OR REPLACE FUNCTION public.increment_goal_amount(goal_id uuid, delta numeric)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE goals
  SET current_amount = current_amount + delta,
      updated_at = now()
  WHERE id = goal_id;
END;
$$;
