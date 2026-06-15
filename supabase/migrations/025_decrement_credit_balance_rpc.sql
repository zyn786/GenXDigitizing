-- Migration 025: RPC for atomic extra credit deduction during order placement
CREATE OR REPLACE FUNCTION decrement_credit_balance(p_client_id UUID, p_amount INT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE clients SET credit_balance = credit_balance - p_amount
  WHERE id = p_client_id AND credit_balance >= p_amount;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
