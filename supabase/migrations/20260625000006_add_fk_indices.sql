-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_parent_id ON public.products(parent_id);

-- Indexes for inventory
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);

-- Indexes for order_items
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Indexes for pending_claims
CREATE INDEX IF NOT EXISTS idx_pending_claims_order_item_id ON public.pending_claims(order_item_id);

-- Indexes for otp_codes
CREATE INDEX IF NOT EXISTS idx_otp_codes_order_id ON public.otp_codes(order_id);

-- Indexes for warranty_logs
CREATE INDEX IF NOT EXISTS idx_warranty_logs_order_item_id ON public.warranty_logs(order_item_id);
CREATE INDEX IF NOT EXISTS idx_warranty_logs_old_inv_id ON public.warranty_logs(old_inventory_id);
CREATE INDEX IF NOT EXISTS idx_warranty_logs_new_inv_id ON public.warranty_logs(new_inventory_id);

-- Indexes for admin tables
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON public.admin_sessions(admin_id);
