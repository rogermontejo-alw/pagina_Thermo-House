import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

async function migrate() {
    console.log('--- Starting Products Migration ---');

    // 1. Create Table (if possible via RPC or assuming user has it)
    // Since we usually can't create tables via standard SDK, 
    // we'll check if they exist or just rely on the user having run the SQL.
    // However, I can try to check if it exists by querying it.

    const { error: checkTableError } = await supabase.from('productos').select('id').limit(1);

    if (checkTableError && checkTableError.code === '42P01') {
        console.error('Table "productos" does not exist. Please run the SQL in supabase/schema.sql first.');
        process.exit(1);
    }

    console.log('Table "productos" exists. Migrating data...');

    // 2. Fetch all regional prices
    const { data: regionalPrices, error: fetchError } = await supabase
        .from('soluciones_precios')
        .select('*');

    if (fetchError) {
        console.error('Error fetching regional prices:', fetchError);
        return;
    }

    // 3. Extract unique master products
    const masters = new Map();
    regionalPrices?.forEach(p => {
        if (!masters.has(p.internal_id)) {
            masters.set(p.internal_id, {
                internal_id: p.internal_id,
                title: p.title,
                category: p.category,
                grosor: p.grosor,
                beneficio_principal: p.beneficio_principal,
                detalle_costo_beneficio: p.detalle_costo_beneficio,
                orden: p.orden
            });
        }
    });

    console.log(`Found ${masters.size} unique products to migrate.`);

    // 4. Insert into productos
    for (const [id, master] of masters) {
        const { data: inserted, error: insertError } = await supabase
            .from('productos')
            .upsert(master, { onConflict: 'internal_id' })
            .select();

        if (insertError) {
            console.error(`Error inserting ${id}:`, insertError);
        } else {
            console.log(`Migrated: ${master.title}`);

            // 5. Update regional prices with product_id
            const productId = inserted?.[0].id;
            const { error: updateError } = await supabase
                .from('soluciones_precios')
                .update({ producto_id: productId })
                .eq('internal_id', id);

            if (updateError) {
                console.error(`Error linking ${id}:`, updateError);
            }
        }
    }

    console.log('--- Migration Finished ---');
}

migrate();
