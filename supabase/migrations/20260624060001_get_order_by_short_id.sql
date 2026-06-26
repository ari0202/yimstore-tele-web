CREATE OR REPLACE FUNCTION get_order_by_short_id(p_short_id TEXT)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
BEGIN
    SELECT id INTO v_order_id
    FROM public.orders
    WHERE id::text ILIKE p_short_id || '%'
    LIMIT 1;
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
