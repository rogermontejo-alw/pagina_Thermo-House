
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

    console.log('--- LOCATIONS ---');
    const { data: locs } = await supabase.from('ubicaciones').select('*');
    console.log(locs);

    console.log('--- MASTER PRODUCTS ---');
    const { data: master } = await supabase.from('productos').select('*');
    console.log(master);

    console.log('--- REGIONAL PRICES ---');
    const { data: prices } = await supabase.from('soluciones_precios').select('*');
    console.log(prices);
};

main();
