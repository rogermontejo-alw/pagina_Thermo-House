-- 1. Reload Schema Cache (to fix PGRST205)
NOTIFY pgrst, 'reload schema';

-- 2. Add 'activo' column to Master Products (productos)
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;

-- 3. Add 'activo' column to Regional Prices (soluciones_precios)
-- This allows pausing a product in a specific city only.
ALTER TABLE public.soluciones_precios 
ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;

-- 4. Reload Schema Cache again just in case
NOTIFY pgrst, 'reload schema';
