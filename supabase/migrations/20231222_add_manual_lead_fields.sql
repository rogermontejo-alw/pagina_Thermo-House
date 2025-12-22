-- Add manual lead fields to cotizaciones table
ALTER TABLE public.cotizaciones 
ADD COLUMN IF NOT EXISTS requires_factura BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS logistic_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;
