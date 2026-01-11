
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateSchema() {
    console.log('Añadiendo columnas de seguimiento de embudo...');

    // Añadimos columnas para rastrear el progreso y el valor de conversión
    const { error } = await supabase.rpc('execute_sql', {
        query: `
      ALTER TABLE cotizaciones 
      ADD COLUMN IF NOT EXISTS last_step TEXT DEFAULT 'inicio',
      ADD COLUMN IF NOT EXISTS conversion_value NUMERIC DEFAULT 0;
    `
    });

    if (error) {
        // Si el RPC no existe, intentamos una consulta directa o informamos
        console.log('Nota: No se pudo ejecutar SQL vía RPC. Si las columnas no existen, por favor añadelos manualmente en el panel de Supabase: last_step (text) y conversion_value (numeric).');
        console.error(error);
    } else {
        console.log('Columnas añadidas con éxito.');
    }
}

updateSchema();
