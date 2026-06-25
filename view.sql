CREATE OR REPLACE VIEW public.admin_product_summary_view AS
SELECT 
    p.id,
    p.name,
    p.category_id,
    c.name as category_name,
    p.price as base_price,
    p.warranty_days,
    p.max_claim_limit,
    p.is_archived,
    p.created_at,
    (
        SELECT MIN(price) FROM public.products v WHERE v.parent_id = p.id
    ) as min_variation_price,
    (
        SELECT MAX(price) FROM public.products v WHERE v.parent_id = p.id
    ) as max_variation_price,
    (
        SELECT COUNT(*) FROM public.products v WHERE v.parent_id = p.id
    ) as variation_count,
    (
        SELECT COUNT(*) 
        FROM public.inventory i 
        WHERE (i.product_id = p.id OR i.product_id IN (SELECT id FROM public.products v WHERE v.parent_id = p.id))
          AND i.status = 'Available'
    ) as total_stock
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
WHERE p.parent_id IS NULL;
