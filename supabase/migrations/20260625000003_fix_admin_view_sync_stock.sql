-- supabase/migrations/20260625000003_fix_admin_view_sync_stock.sql

DROP VIEW IF EXISTS public.admin_product_summary_view;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_sync_stock BOOLEAN DEFAULT FALSE;
CREATE OR REPLACE VIEW public.admin_product_summary_view AS
SELECT p.id,
    p.name,
    p.description,
    p.thumbnail_url,
    p.category_id,
    c.name AS category_name,
    p.price AS base_price,
    p.warranty_days,
    p.max_claim_limit,
    p.is_archived,
    p.is_sync_stock,
    p.created_at,
    0::numeric AS min_variation_price,
    0::numeric AS max_variation_price,
    0::bigint AS variation_count,
    (
        SELECT count(*) FROM inventory i 
        WHERE 
            (p.is_sync_stock = TRUE AND i.category_id = p.category_id AND i.product_id IS NULL AND i.status = 'Available')
            OR
            ((p.is_sync_stock = FALSE OR p.is_sync_stock IS NULL) AND i.product_id = p.id AND i.status = 'Available')
    ) AS total_stock,
    (
        SELECT count(*) FROM inventory i 
        WHERE 
            (p.is_sync_stock = TRUE AND i.category_id = p.category_id AND i.product_id IS NULL AND i.status = 'Used')
            OR
            ((p.is_sync_stock = FALSE OR p.is_sync_stock IS NULL) AND i.product_id = p.id AND i.status = 'Used')
    ) AS sold_stock,
    (
        SELECT max(created_at) FROM inventory i 
        WHERE 
            (p.is_sync_stock = TRUE AND i.category_id = p.category_id AND i.product_id IS NULL)
            OR
            ((p.is_sync_stock = FALSE OR p.is_sync_stock IS NULL) AND i.product_id = p.id)
    ) AS latest_restock
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;
