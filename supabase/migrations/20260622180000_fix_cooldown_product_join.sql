CREATE OR REPLACE FUNCTION public.check_cooldown_validity(p_order_item_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_last_claim TIMESTAMP WITH TIME ZONE;
    v_cooldown_val INTEGER;
    v_cooldown_unit TEXT;
BEGIN
    SELECT claimed_at INTO v_last_claim
    FROM public.warranty_logs
    WHERE order_item_id = p_order_item_id
    ORDER BY claimed_at DESC
    LIMIT 1;

    IF v_last_claim IS NULL THEN
        RETURN TRUE;
    END IF;

    SELECT p.cooldown_value, p.cooldown_unit::TEXT INTO v_cooldown_val, v_cooldown_unit
    FROM public.order_items oi
    JOIN public.inventory i ON oi.inventory_id = i.id
    JOIN public.products p ON i.product_id = p.id
    WHERE oi.id = p_order_item_id;

    IF v_cooldown_val IS NULL OR v_cooldown_val = 0 THEN
        RETURN TRUE;
    END IF;

    RETURN NOW() >= (v_last_claim + (v_cooldown_val || ' ' || v_cooldown_unit)::INTERVAL);
END;
$$;
