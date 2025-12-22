
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

    console.log('--- Checking table: productos ---');
    const { data: prodData, error: prodError } = await supabase.from('productos').select('*').limit(1);

    if (prodError) {
        console.log('❌ Error querying productos:', prodError.message);
    } else {
        console.log('✅ Columns in productos:', prodData.length > 0 ? Object.keys(prodData[0]) : 'Table is empty');
        if (prodData.length > 0) {
            console.log('Sample row:', prodData[0]);
        }
    }
};

main();
