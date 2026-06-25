-- supabase/migrations/20260622160000_fix_trigger_after.sql

DROP TRIGGER IF EXISTS fulfill_pending_claims_on_restock ON public.inventory;

CREATE OR REPLACE FUNCTION public.trigger_fulfill_pending_claims()
RETURNS TRIGGER AS $$
DECLARE
    v_pending_claim RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'maintenance_mode' AND value = 'true') THEN 
        RETURN NEW; 
    END IF;

    IF NEW.status = 'Available' THEN
        SELECT pc.id, pc.order_item_id, oi.inventory_id AS old_inventory_id
        INTO v_pending_claim
        FROM public.pending_claims pc
        JOIN public.order_items oi ON pc.order_item_id = oi.id
        JOIN public.inventory old_inv ON oi.inventory_id = old_inv.id
        WHERE pc.status = 'pending' AND old_inv.product_id = NEW.product_id
        ORDER BY pc.created_at ASC
        LIMIT 1 FOR UPDATE OF pc, oi SKIP LOCKED;

        IF FOUND THEN
            -- Update status inventory ini menjadi Used (safe because trigger is AFTER)
            UPDATE public.inventory SET status = 'Used' WHERE id = NEW.id;
            
            UPDATE public.pending_claims SET status = 'fulfilled' WHERE id = v_pending_claim.id;
            UPDATE public.order_items SET inventory_id = NEW.id WHERE id = v_pending_claim.order_item_id;
            UPDATE public.inventory SET status = 'Revoked' WHERE id = v_pending_claim.old_inventory_id;

            INSERT INTO public.warranty_logs (order_item_id, old_inventory_id, new_inventory_id, delivery_status)
            VALUES (v_pending_claim.order_item_id, v_pending_claim.old_inventory_id, NEW.id, 'completed');
            
            INSERT INTO public.outbox_events (event_type, payload, status)
            VALUES ('DELIVER_WARRANTY_CREDENTIAL', jsonb_build_object('order_item_id', v_pending_claim.order_item_id), 'pending');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fulfill_pending_claims_on_restock
AFTER INSERT OR UPDATE OF status ON public.inventory
FOR EACH ROW 
WHEN (NEW.status = 'Available' AND pg_trigger_depth() < 1)
EXECUTE FUNCTION public.trigger_fulfill_pending_claims();
