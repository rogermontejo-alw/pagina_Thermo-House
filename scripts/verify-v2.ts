
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const main = async () => {
    console.log('--- Verifying Supabase Setup ---');

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing env vars in .env.local');
        return;
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log('\nQuerying "soluciones_precios" to verify new data...');
    const { data, error } = await supabaseAdmin.from('soluciones_precios').select('*');

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ Success! Found solutions:');
        data.forEach(s => {
            console.log(`- ${s.title}: $${s.precio_contado_m2} (ID: ${s.internal_id})`);
        });
    }
};

main();
