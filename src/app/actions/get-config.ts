'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function getAppConfig(key: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('app_config')
            .select('value')
            .eq('key', key)
            .single();

        if (error) {
            console.warn(`Config key ${key} not found in DB, falling back to env.`);
            return null;
        }

        return data.value;
    } catch (err) {
        return null;
    }
}
