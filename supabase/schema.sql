-- Reseteo completo de la base de datos
-- Thermo House V2 Schema

-- 1. Extensiones necesarias
create extension if not exists "uuid-ossp";

-- 2. Limpieza (Cuidado: Borra datos existentes)
drop table if exists public.cotizaciones cascade;
drop table if exists public.soluciones_precios cascade;
drop table if exists public.ubicaciones cascade;
drop table if exists public.app_config cascade;

-- 2.5 Tabla de Ubicaciones (Ciudades y Estados)
create table public.ubicaciones (
  id uuid default uuid_generate_v4() primary key,
  ciudad text not null,
  estado text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(ciudad, estado)
);

-- Insertar ubicaciones iniciales
insert into public.ubicaciones (ciudad, estado) values
('Mérida', 'Yucatán'),
('Cancún', 'Quintana Roo'),
('Playa del Carmen', 'Quintana Roo'),
('Campeche', 'Campeche'),
('Villahermosa', 'Tabasco'),
('Veracruz', 'Veracruz'),
('Cuernavaca', 'Morelos'),
('Chihuahua', 'Chihuahua'),
('Ciudad Juárez', 'Chihuahua'),
('Puebla', 'Puebla'),
('Monterrey', 'Nuevo León');

-- 3. Tabla de Productos (soluciones_precios)
create table public.soluciones_precios (
  id uuid default uuid_generate_v4() primary key,
  internal_id text not null unique,
  title text not null,
  category text not null check (category in ('concrete', 'sheet', 'both')),
  precio_contado_m2 integer not null,
  precio_msi_m2 integer not null,
  grosor text,
  beneficio_principal text,
  detalle_costo_beneficio text,
  orden integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabla de Cotizaciones/Leads (cotizaciones)
create table public.cotizaciones (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  address text,
  estado text,
  ciudad text,
  google_maps_link text,
  area numeric not null,
  solution_id uuid references public.soluciones_precios(id),
  precio_total_contado numeric,
  precio_total_msi numeric,
  status text check (status in ('Nuevo', 'Contactado', 'Visita Técnica', 'Cerrado')) default 'Nuevo',
  contact_info jsonb not null, -- { name, phone, email }
  notas text,
  factura boolean default false,
  fecha_nacimiento date,
  is_out_of_zone boolean default false
);

-- 5. Tabla de Configuración (Para APIs y llaves - SEGURIDAD)
create table public.app_config (
  id uuid default uuid_generate_v4() primary key,
  key text not null unique,
  value text not null,
  description text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Seguridad (RLS)
alter table public.soluciones_precios enable row level security;
alter table public.cotizaciones enable row level security;
alter table public.app_config enable row level security;

-- Políticas de Acceso
-- Productos: Lectura pública (o solo service_role si prefieres ocultar precios)
create policy "Permitir lectura publica de productos" on public.soluciones_precios for select using (true);

-- Cotizaciones: Insertar desde la web, leer solo ADMIN (service_role)
create policy "Permitir insercion publica de cotizaciones" on public.cotizaciones for insert with check (true);
create policy "Solo admin lee cotizaciones" on public.cotizaciones for select using (auth.role() = 'service_role');

-- Configuración: SOLO accesible por service_role (Backend)
create policy "Privacidad total config" on public.app_config using (auth.role() = 'service_role');

-- 7. Insertar Productos Iniciales
insert into public.soluciones_precios 
(internal_id, title, category, precio_contado_m2, precio_msi_m2, grosor, beneficio_principal, detalle_costo_beneficio, orden) 
values
('th-fix', 'TH FIX', 'concrete', 79, 94, '1000 micras', 'Impermeabilidad y Reflectancia Básica', 'Sistema de mantenimiento preventivo. Protege contra filtraciones leves con la inversión más baja.', 1),
('th-light', 'TH LIGHT', 'concrete', 119, 142, '1/2 cm (5 mm)', 'Impermeabilidad Total y Aislamiento Inicial', 'Elimina goteras y comienza a generar ahorro energético desde el primer día.', 2),
('th-forte', 'TH FORTE', 'concrete', 152, 181, '1 cm (10 mm)', 'Aislamiento Térmico Óptimo', 'Reduce significativamente el uso de aire acondicionado y mejora el confort interior.', 3),
('th-3-4', 'TH 3/4', 'both', 186, 221, '1.9 cm (19 mm)', 'Aislamiento Térmico/Acústico Alto', 'Especial para lámina y concreto. Reduce notablemente el ruido por lluvia.', 4),
('th-ingles', 'TH Inglés', 'both', 200, 238, '2.5 cm (25 mm)', 'Aislamiento Superior y Protección Máxima', 'El sistema más completo y duradero. Máximo aislamiento térmico y acústico.', 5);
