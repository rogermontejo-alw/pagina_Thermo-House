-- Migration: Add branch details to locations table
ALTER TABLE public.ubicaciones 
ADD COLUMN IF NOT EXISTS direccion text,
ADD COLUMN IF NOT EXISTS telefono text,
ADD COLUMN IF NOT EXISTS correo text,
ADD COLUMN IF NOT EXISTS google_maps_link text,
ADD COLUMN IF NOT EXISTS redes_sociales jsonb DEFAULT '{"facebook": "", "instagram": "", "whatsapp": ""}'::jsonb,
ADD COLUMN IF NOT EXISTS is_branch boolean DEFAULT false;

-- Comment on columns for clarity
COMMENT ON COLUMN public.ubicaciones.direccion IS 'Dirección física de la sucursal';
COMMENT ON COLUMN public.ubicaciones.telefono IS 'Teléfono de contacto de la sucursal';
COMMENT ON COLUMN public.ubicaciones.correo IS 'Correo electrónico de la sucursal';
COMMENT ON COLUMN public.ubicaciones.google_maps_link IS 'Enlace a Google Maps de la sucursal';
COMMENT ON COLUMN public.ubicaciones.redes_sociales IS 'Enlaces a redes sociales (JSON)';
COMMENT ON COLUMN public.ubicaciones.is_branch IS 'Indica si esta ubicación tiene una oficina física/sucursal visible';
