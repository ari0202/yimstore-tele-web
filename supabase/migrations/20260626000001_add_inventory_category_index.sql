-- Add the final missing index on inventory.category_id
CREATE INDEX IF NOT EXISTS idx_inventory_category_id ON public.inventory(category_id);
