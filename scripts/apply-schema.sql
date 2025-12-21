-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: soluciones_precios
-- Stores base prices and technical details
drop table if exists public.soluciones_precios cascade;

create table public.soluciones_precios (
  id uuid default uuid_generate_v4() primary key,
  internal_id text not null unique, -- e.g. 'th-fix'
  title text not null,
  category text not null check (category in ('concrete', 'sheet', 'both')),
  precio_contado_m2 integer not null,
  precio_msi_m2 integer not null,
  grosor text,
  beneficio_principal text,
  detalle_costo_beneficio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: cotizaciones
-- Stores leads and their quotes
drop table if exists public.cotizaciones cascade;

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
  contact_info jsonb not null
);

-- Enable Row Level Security (RLS)
alter table public.cotizaciones enable row level security;
alter table public.soluciones_precios enable row level security;

-- Policies
create policy "Enable insert for public" on public.cotizaciones for insert with check (true);
create policy "Enable read for service_role" on public.soluciones_precios for select using (auth.role() = 'service_role');
create policy "Service Role full access on cotizaciones" on public.cotizaciones using (auth.role() = 'service_role');

-- Insert the 5 products from the image
insert into public.soluciones_precios 
(internal_id, title, category, precio_contado_m2, precio_msi_m2, grosor, beneficio_principal, detalle_costo_beneficio) 
values
('th-fix', 'TH FIX', 'concrete', 79, ROUND(79 / 0.84), '1000 micras', 'Impermeabilidad y Reflectancia Básica', 'Sistema de mantenimiento preventivo. Incluye preparación del techo, aplicación localizada de poliuretano en grietas, fisuras y puntos críticos, y capa acrílica final reflectiva. Ideal para filtraciones leves, prolonga la vida útil del concreto y previene daños mayores con la inversión más baja.'),
('th-light', 'TH LIGHT', 'concrete', 119, ROUND(119 / 0.84), '1/2 cm (5 mm)', 'Impermeabilidad Total y Aislamiento Inicial', 'Impermeabilización profesional continua. Preparación completa del techo, aplicación de poliuretano en toda la superficie formando una membrana sin uniones, sellado de microgrietas y capa acrílica protectora. Elimina goteras y comienza a generar ahorro energético desde el primer día. Excelente relación costo-beneficio.'),
('th-forte', 'TH FORTE', 'concrete', 152, ROUND(152 / 0.84), '1 cm (10 mm)', 'Aislamiento Térmico Óptimo e Impermeabilidad Máxima', 'Sistema Premium de alto desempeño. Incluye poliuretano de mayor espesor y densidad, máxima resistencia a filtraciones y mejor aislamiento térmico. Reduce significativamente el uso de aire acondicionado, mejora el confort interior y brinda protección duradera al concreto en climas exigentes.'),
('th-3-4', 'TH 3/4', 'both', 186, ROUND(186 / 0.84), '1.9 cm (19 mm)', 'Impermeabilidad Total y Aislamiento Térmico/Acústico Alto', 'Sistema integral para lámina y concreto. Preparación completa, aplicación de poliuretano de 3/4", sellado total de traslapes, tornillos y fisuras, reducción notable del ruido por lluvia y capa acrílica final reflectiva. Transforma techos calientes y ruidosos en espacios confortables con excelente costo-beneficio.'),
('th-ingles', 'TH Inglés', 'both', 200, ROUND(200 / 0.84), '2.5 cm (25 mm)', 'Aislamiento Térmico y Acústico Superior + Máxima Protección', 'Sistema más completo y duradero. Poliuretano de 1", máximo aislamiento térmico y acústico, estabilidad de temperatura interior, menor consumo energético y protección reforzada contra impactos e intemperie. Ideal para climas extremos y clientes que buscan confort total y larga vida útil.');
