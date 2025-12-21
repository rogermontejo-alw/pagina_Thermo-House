'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from './admin-auth';

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

export async function updateAppConfig(key: string, value: string) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos.' };
        }

        const { error } = await supabaseAdmin
            .from('app_config')
            .upsert({ key, value }, { onConflict: 'key' });

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error updating config:', err);
        return { success: false, message: err.message };
    }
}
