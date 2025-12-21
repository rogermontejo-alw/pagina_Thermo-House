
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
    const { data, error } = await supabase.from('soluciones_precios').select('*').limit(1);

    if (error) {
        console.error('❌ Error querying table:', error.message);
        // Let's check if the table even exists
        const { error: tableError } = await supabase.from('soluciones_precios').select('count');
        if (tableError) console.error('❌ Table might not exist or no permission:', tableError.message);
    } else if (data && data.length > 0) {
        console.log('✅ Found columns:', Object.keys(data[0]));
        console.log('✅ First row:', data[0]);
    } else {
        console.log('✅ Table is empty but exists.');
    }
};

main();
