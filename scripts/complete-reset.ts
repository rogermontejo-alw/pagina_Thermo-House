
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const main = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Error: Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('--- RESET COMPLETO DE BASE DE DATOS ---');

    // 1. Limpiar todo
    console.log('Borrando datos antiguos...');
    await supabase.from('cotizaciones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('soluciones_precios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('app_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Insertar Productos
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
        { internal_id: 'th-3-4', title: 'TH 3/4', category: 'sheet', precio_contado_m2: 186, precio_msi_m2: 221, grosor: '1.9 cm (19 mm)', beneficio_principal: 'Aislamiento Térmico/Acústico Alto', detalle_costo_beneficio: 'Especial para lámina y naves industriales.', orden: 4 },
        { internal_id: 'th-ingles', title: 'TH Inglés', category: 'sheet', precio_contado_m2: 200, precio_msi_m2: 238, grosor: '2.5 cm (25 mm)', beneficio_principal: 'Aislamiento Superior y Protección Máxima', detalle_costo_beneficio: 'El sistema más completo para techos de lámina.', orden: 5 }
    ];

    console.log('Insertando productos...');
    for (const p of products) {
        const { error } = await supabase.from('soluciones_precios').insert(p);
        if (error) {
            console.error(`❌ Error en producto ${p.internal_id}:`, error.message);
        } else {
            console.log(`✅ ${p.internal_id} insertado.`);
        }
    }

    // 3. Insertar Configuración (APIs)
    console.log('Moviendo llaves API a la tabla app_config...');
    const configs = [
        { key: 'GOOGLE_MAPS_KEY', value: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '', description: 'Llave de Google Maps' },
        { key: 'DASHBOARD_PASSWORD', value: 'admin123', description: 'Contraseña para panel administrativo' }
    ];

    for (const c of configs) {
        if (c.value) {
            const { error } = await supabase.from('app_config').upsert(c);
            if (error) console.error(`❌ Error en config ${c.key}:`, error.message);
            else console.log(`✅ Config ${c.key} guardada en DB.`);
        }
    }

    console.log('--- Proceso Finalizado ---');
};

main();
