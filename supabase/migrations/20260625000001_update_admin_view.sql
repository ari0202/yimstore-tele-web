DROP VIEW IF EXISTS public.admin_product_summary_view;
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
    p.created_at,
    0::numeric AS min_variation_price,
    0::numeric AS max_variation_price,
    0::bigint AS variation_count,
    (SELECT count(*) FROM inventory i WHERE i.product_id = p.id AND i.status = 'Available') AS total_stock
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;
