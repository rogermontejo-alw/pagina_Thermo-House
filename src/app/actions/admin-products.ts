'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function getProducts() {
    try {
        const { data, error } = await supabaseAdmin
            .from('soluciones_precios')
            .select('*')
            .order('ciudad', { ascending: true })
            .order('orden', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        return { success: false, message: 'Error al cargar los productos.' };
    }
}

export async function updateProduct(id: string, updates: any) {
    try {
        const { error } = await supabaseAdmin
            .from('soluciones_precios')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}

export async function cloneProductToCity(product: any, newCity: string) {
    try {
        const { id, created_at, ...rest } = product;
        const { error } = await supabaseAdmin
            .from('soluciones_precios')
            .insert({
                ...rest,
                ciudad: newCity
            });

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message || 'Error al clonar producto.' };
    }
}

export async function deleteProduct(id: string) {
    try {
        const { error } = await supabaseAdmin
            .from('soluciones_precios')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}
