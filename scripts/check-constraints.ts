
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

    const { data, error } = await supabase.rpc('check_table_constraints', { t_name: 'soluciones_precios' });
    if (error) {
        // Fallback: use raw query via a temporary function if possible, or just try to insert a duplicate and see
        console.log('Error checking constraints:', error.message);
    } else {
        console.log('Constraints:', data);
    }
};

main();
