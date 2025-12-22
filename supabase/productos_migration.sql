-- Migration to separate Master Products from Regional Prices
-- 1. Create the Master Products table
CREATE TABLE IF NOT EXISTS public.productos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    internal_id text NOT NULL UNIQUE,
    title text NOT NULL,
    category text NOT NULL CHECK (category IN ('concrete', 'sheet', 'both')),
    grosor text,
    beneficio_principal text,
    detalle_costo_beneficio text,
    orden integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add product_id to the pricing table (soluciones_precios)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'soluciones_precios' AND COLUMN_NAME = 'producto_id') THEN
        ALTER TABLE public.soluciones_precios ADD COLUMN producto_id uuid REFERENCES public.productos(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Note: After running this, run the migration script:
-- npx ts-node scripts/migrate-products-v2.ts
