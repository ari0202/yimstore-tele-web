-- Drop the unique index that prevents duplicate active credentials
DROP INDEX IF EXISTS unique_active_credential;

-- Update the RPC to allow inserting duplicates (remove ON CONFLICT DO NOTHING)
CREATE OR REPLACE FUNCTION rpc_bulk_insert_inventory(
    p_admin_id UUID,
    p_product_id UUID,
    p_credentials_array TEXT[]
) RETURNS INTEGER AS $$
DECLARE
    v_inserted_count INTEGER;
BEGIN
    WITH inserted AS (
        INSERT INTO public.inventory (product_id, credential_data, status)
        SELECT p_product_id, cred, 'Available'
        FROM unnest(p_credentials_array) AS cred
        RETURNING 1
    )
    SELECT count(*) INTO v_inserted_count FROM inserted;

    -- Audit Log
    INSERT INTO public.audit_logs (admin_id, action, details)
    VALUES (
        p_admin_id,
        'BULK_INSERT_INVENTORY',
        jsonb_build_object(
            'product_id', p_product_id,
            'inserted_count', v_inserted_count
        )
    );

    RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
