-- supabase/migrations/20260622120002_rls_admin_fix.sql

-- PERFORMANCE INDEXES (Mencegah seq-scan saat evaluasi RLS)
CREATE INDEX IF NOT EXISTS idx_order_items_inventory_id ON public.order_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Clean up previous policies
DROP POLICY IF EXISTS "Block public read admin" ON public.admins;
DROP POLICY IF EXISTS "Block public insert admin" ON public.admins;
DROP POLICY IF EXISTS "Block public update admin" ON public.admins;
DROP POLICY IF EXISTS "Block public delete admin" ON public.admins;
DROP POLICY IF EXISTS "Admins read own" ON public.admins;
DROP POLICY IF EXISTS "Public products viewable" ON public.products;
DROP POLICY IF EXISTS "Admins manage products" ON public.products;
DROP POLICY IF EXISTS "Admins manage inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users read own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
DROP POLICY IF EXISTS "Users read own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users read own profile" ON public.users;
DROP POLICY IF EXISTS "Users read own warranty logs" ON public.warranty_logs;

-- Helper logic: Admin check for custom JWT
-- (current_setting('request.jwt.claims', true)::json->>'sub')::uuid

-- 1. Admins Table & Products
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read own" ON public.admins FOR SELECT USING (id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public products viewable" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid));

-- 2. Inventory 
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage inventory" ON public.inventory FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid));
CREATE POLICY "Users read own inventory" ON public.inventory FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.order_items oi 
        JOIN public.orders o ON oi.order_id = o.id 
        WHERE oi.inventory_id = inventory.id AND o.user_id = auth.uid()
    )
);

-- 3. Transaksional RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid));

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.users FOR SELECT USING (id = auth.uid());

ALTER TABLE public.warranty_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own warranty logs" ON public.warranty_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.order_items oi 
        JOIN public.orders o ON oi.order_id = o.id 
        WHERE oi.id = warranty_logs.order_item_id AND o.user_id = auth.uid()
    )
);
