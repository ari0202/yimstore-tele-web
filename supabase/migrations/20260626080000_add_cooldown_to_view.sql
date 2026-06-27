DROP VIEW IF EXISTS public.admin_product_summary_view;
CREATE OR REPLACE VIEW public.admin_product_summary_view AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.thumbnail_url,
    p.category_id,
    c.name as category_name,
    p.price as base_price,
    p.warranty_days,
    p.max_claim_limit,
    p.cooldown_value,
    p.cooldown_unit,
    p.is_archived,
    p.created_at,
    p.is_sync_stock,
    (SELECT COUNT(*) FROM public.inventory i WHERE i.product_id = p.id AND i.status = 'Available') as available_stock,
    (SELECT COUNT(*) FROM public.inventory i WHERE i.product_id = p.id AND i.status = 'Used') as sold_stock,
    (SELECT COUNT(*) FROM public.inventory i WHERE i.product_id = p.id AND i.status != 'Revoked') as total_stock
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
WHERE p.parent_id IS NULL;
