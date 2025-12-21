
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
    console.log('Seeding database...');

    // 0. Clear dependent tables
    await supabase.from('cotizaciones').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 1. Clear existing solutions
    const { error: deleteError } = await supabase
        .from('soluciones_precios')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
        console.error('Error clearing table:', deleteError);
        process.exit(1);
    }

    // 2. Insert new data
    const solutions = [
        {
            internal_id: 'th-fix',
            title: 'TH FIX',
            category: 'concrete',
            precio_contado_m2: 79,
            precio_msi_m2: Math.round(79 / 0.84),
            grosor: '1000 micras',
            beneficio_principal: 'Impermeabilidad y Reflectancia Básica',
            detalle_costo_beneficio: 'Sistema de mantenimiento preventivo. Incluye preparación del techo, aplicación localizada de poliuretano en grietas, fisuras y puntos críticos, y capa acrílica final reflectiva.'
        },
        {
            internal_id: 'th-light',
            title: 'TH LIGHT',
            category: 'concrete',
            precio_contado_m2: 119,
            precio_msi_m2: Math.round(119 / 0.84),
            grosor: '1/2 cm (5 mm)',
            beneficio_principal: 'Impermeabilidad Total y Aislamiento Inicial',
            detalle_costo_beneficio: 'Impermeabilización profesional continua. Preparación completa del techo, aplicación de poliuretano en toda la superficie formando una membrana sin uniones.'
        },
        {
            internal_id: 'th-forte',
            title: 'TH FORTE',
            category: 'concrete',
            precio_contado_m2: 152,
            precio_msi_m2: Math.round(152 / 0.84),
            grosor: '1 cm (10 mm)',
            beneficio_principal: 'Aislamiento Térmico Óptimo e Impermeabilidad Máxima',
            detalle_costo_beneficio: 'Sistema Premium de alto desempeño. Incluye poliuretano de mayor espesor y densidad, máxima resistencia a filtraciones y mejor aislamiento térmico.'
        },
        {
            internal_id: 'th-3-4',
            title: 'TH 3/4',
            category: 'both',
            precio_contado_m2: 186,
            precio_msi_m2: Math.round(186 / 0.84),
            grosor: '1.9 cm (19 mm)',
            beneficio_principal: 'Aislamiento Térmico/Acústico Alto',
            detalle_costo_beneficio: 'Sistema integral para lámina y concreto. Aplicación de poliuretano de 3/4", sellado total de traslapes, tornillos y fisuras.'
        },
        {
            internal_id: 'th-ingles',
            title: 'TH Inglés',
            category: 'both',
            precio_contado_m2: 200,
            precio_msi_m2: Math.round(200 / 0.84),
            grosor: '2.5 cm (25 mm)',
            beneficio_principal: 'Aislamiento Térmico y Acústico Superior',
            detalle_costo_beneficio: 'Sistema más completo y duradero. Poliuretano de 1", máximo aislamiento térmico y acústico, estabilidad de temperatura interior.'
        }
    ];

    const { error: insertError } = await supabase
        .from('soluciones_precios')
        .insert(solutions);

    if (insertError) {
        console.error('Error inserting data:', insertError);
        process.exit(1);
    }

    console.log('✅ Base de datos actualizada con éxito!');
}

seed();
