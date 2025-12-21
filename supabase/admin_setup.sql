
-- Migration to support Admin Dashboard and Webhooks

-- 1. Add status column to cotizaciones if missing
ALTER TABLE public.cotizaciones 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Nuevo';

-- 2. Add contact/location columns for better querying (optional if using JSONB, but good for standardization)
ALTER TABLE public.cotizaciones
ADD COLUMN IF NOT EXISTS nombre_cliente TEXT,
ADD COLUMN IF NOT EXISTS telefono TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS ciudad TEXT;

-- 3. Enhance soluciones_precios to support Cities (for "Edit prices by city")
ALTER TABLE public.soluciones_precios
ADD COLUMN IF NOT EXISTS ciudad TEXT DEFAULT 'Mérida';

-- 4. Enable RLS or update policies if needed (already done in previous steps usually)

-- 5. Notes for Webhook Configuration:
-- To enable the WhatsApp webhook:
-- 1. Go to Supabase Dashboard -> Database -> Webhooks
-- 2. Create a new Webhook 'whatsapp-notification'
-- 3. Table: public.cotizaciones
-- 4. Events: INSERT
-- 5. Type: HTTP Request (POST)
-- 6. URL: https://[YOUR-DOMAIN]/api/webhooks/new-quote
-- 7. Add Header: x-supabase-secret (optional for security)
