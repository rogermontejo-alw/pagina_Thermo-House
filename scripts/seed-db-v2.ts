
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const main = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing env vars');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('--- Reseeding Database and Fixing Schema ---');

    // Note: We cannot do ALTER TABLE via standard REST API. 
    // We will try to update the data for existing columns first.

    const products = [
        {
            internal_id: 'th-fix',
            title: 'TH FIX',
            category: 'concrete',
            precio_contado_m2: 79,
            precio_msi_m2: 94,
            grosor: '1000 micras',
            beneficio_principal: 'Impermeabilidad y Reflectancia Básica',
            detalle_costo_beneficio: 'Sistema de mantenimiento preventivo. Protege contra filtraciones leves con la inversión más baja.'
        },
        {
            internal_id: 'th-light',
            title: 'TH LIGHT',
            category: 'concrete',
            precio_contado_m2: 119,
            precio_msi_m2: 142,
            grosor: '1/2 cm (5 mm)',
            beneficio_principal: 'Impermeabilidad Total y Aislamiento Inicial',
            detalle_costo_beneficio: 'Elimina goteras y comienza a generar ahorro energético desde el primer día.'
        },
        {
            internal_id: 'th-forte',
            title: 'TH FORTE',
            category: 'concrete',
            precio_contado_m2: 152,
            precio_msi_m2: 181,
            grosor: '1 cm (10 mm)',
            beneficio_principal: 'Aislamiento Térmico Óptimo',
            detalle_costo_beneficio: 'Reduce significativamente el uso de aire acondicionado y mejora el confort interior.'
        },
        {
            internal_id: 'th-3-4',
            title: 'TH 3/4',
            category: 'both',
            precio_contado_m2: 186,
            precio_msi_m2: 221,
            grosor: '1.9 cm (19 mm)',
            beneficio_principal: 'Aislamiento Térmico/Acústico Alto',
            detalle_costo_beneficio: 'Especial para lámina y concreto. Reduce notablemente el ruido por lluvia.'
        },
        {
            internal_id: 'th-ingles',
            title: 'TH Inglés',
            category: 'both',
            precio_contado_m2: 200,
            precio_msi_m2: 238,
            grosor: '2.5 cm (25 mm)',
            beneficio_principal: 'Aislamiento Superior y Protección Máxima',
            detalle_costo_beneficio: 'El sistema más duradero. Máximo aislamiento térmico y acústico.'
        }
    ];

    // Clear dependent table first
    console.log('Clearing old data...');
    await supabase.from('cotizaciones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('soluciones_precios').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Try to insert one by one to detect schema errors
    for (const p of products) {
        const { error } = await supabase.from('soluciones_precios').insert(p);
        if (error) {
            console.error(`❌ Error inserting ${p.internal_id}:`, error.message);
            if (error.message.includes('column') && error.message.includes('not exist')) {
                console.log('⚠️ IMPORTANT: Your database schema is outdated. Please run the SQL in supabase/schema.sql in the Supabase SQL Editor.');
                break;
            }
        } else {
            console.log(`✅ Inserted ${p.internal_id}`);
        }
    }

    console.log('--- Done ---');
};

main();
