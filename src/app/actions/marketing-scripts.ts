'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from './admin-auth';

export async function getMarketingScripts() {
    try {
        const { data, error } = await supabaseAdmin
            .from('marketing_scripts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (err: any) {
        console.error('Error fetching marketing scripts:', err);
        return { success: false, message: err.message };
    }
}

export async function createMarketingScript(script: { platform: string; pixel_id: string; is_active?: boolean }) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos.' };
        }

        const { data, error } = await supabaseAdmin
            .from('marketing_scripts')
            .insert([script])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err: any) {
        console.error('Error creating marketing script:', err);
        return { success: false, message: err.message };
    }
}

export async function updateMarketingScript(id: string, updates: any) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos.' };
        }

        const { error } = await supabaseAdmin
            .from('marketing_scripts')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error updating marketing script:', err);
        return { success: false, message: err.message };
    }
}

export async function deleteMarketingScript(id: string) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos.' };
        }

        const { error } = await supabaseAdmin
            .from('marketing_scripts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error deleting marketing script:', err);
        return { success: false, message: err.message };
    }
}

export async function getActiveScripts() {
    try {
        const { data, error } = await supabaseAdmin
            .from('marketing_scripts')
            .select('platform, pixel_id')
            .eq('is_active', true);

        if (error) throw error;
        return { success: true, data };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}
