
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

    // Check table structure by trying to select all columns
    const { data, error } = await supabase.from('soluciones_precios').select('*').limit(1);

    if (error) {
        console.log('❌ Error querying table:', error.message);
    } else {
        console.log('✅ Columns in table:', data.length > 0 ? Object.keys(data[0]) : 'Table is empty, checking columns via RPC or metadata...');
    }

    // Try to get column names from information_schema
    const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'soluciones_precios' });
    if (colError) {
        // Fallback: try to run a simple SQL to check if the column is there
        const { error: testError } = await supabase.from('soluciones_precios').select('beneficio_principal').limit(1);
        if (testError) {
            console.log('❌ beneficio_principal column NOT FOUND:', testError.message);
        } else {
            console.log('✅ beneficio_principal column EXISTS');
        }
    } else {
        console.log('Table columns:', cols);
    }
};

main();
