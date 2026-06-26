-- Add any missing foreign key indexes that might not have been created yet
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_inventory_id ON public.order_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_warranty_logs_order_item_id ON public.warranty_logs(order_item_id);
CREATE INDEX IF NOT EXISTS idx_warranty_logs_handled_by ON public.warranty_logs(handled_by);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_outbox_events_status ON public.outbox_events(status);
