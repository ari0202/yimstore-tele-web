-- Add indices for faster dashboard time-series querying
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON public.order_items(created_at);
