
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
    console.log('🔗 Connected to Supabase URL:', supabaseUrl);
    // Extract Project ID: https://<project_id>.supabase.co
    const projectId = supabaseUrl.split('//')[1].split('.')[0];
    console.log('🆔 Project ID:', projectId);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify security columns
    console.log('🛡️ Verifying security columns in "admin_users"...');
    const { data: secData, error: secError } = await supabase
        .from('admin_users')
        .select('failed_attempts, locked_until')
        .limit(1);

    if (secError) {
        console.error('❌ Error: Could not find security columns. Did you run the migration?', secError.message);
    } else {
        console.log('✅ Security columns (failed_attempts, locked_until) found. System is ARMED.');
    }

    // Query to list all tables in public schema
    const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

    // Supabase client might not let us query information_schema directly with .from(). 
    // Instead valid approach is usually rpc or standard query if allowed, but .from usually targets public tables.
    // Let's try listing a known table 'cotizaciones' and 'admin_users' specifically to see response.

    console.log('Checking "admin_users"...');
    const { data: adminData, error: adminError } = await supabase.from('admin_users').select('count', { count: 'exact', head: true });

    if (adminError) {
        console.error('❌ Error accessing admin_users:', adminError.message);
    } else {
        console.log('✅ admin_users exists.');
    }

    console.log('Checking "cotizaciones"...');
    const { data: cotData, error: cotError } = await supabase.from('cotizaciones').select('count', { count: 'exact', head: true });
    if (cotError) {
        console.error('❌ Error accessing cotizaciones:', cotError.message);
    } else {
        console.log('✅ cotizaciones exists.');
    }
};

main();
