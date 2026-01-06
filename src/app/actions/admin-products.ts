'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from './admin-auth';
import { revalidatePath } from 'next/cache';

export async function getProducts(cityFilter?: string) {
    try {
        let query = supabaseAdmin
            .from('soluciones_precios')
            .select('*');

        if (cityFilter && cityFilter !== 'Todas') {
            query = query.eq('ciudad', cityFilter);
        }

        const { data, error } = await query
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
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos para cambiar precios.' };
        }

        const { error } = await supabaseAdmin
            .from('soluciones_precios')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/');
        revalidatePath('/sistemas');
        revalidatePath('/cotizador');
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}

export async function cloneProductToCity(product: any, newCity: string) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos para clonar tarifas.' };
        }

        const { id, created_at, ...rest } = product;
        const { error } = await supabaseAdmin
            .from('soluciones_precios')
            .insert({
                ...rest,
                ciudad: newCity
            });

        if (error) throw error;

        revalidatePath('/');
        revalidatePath('/sistemas');
        revalidatePath('/cotizador');
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message || 'Error al clonar producto.' };
    }
}

export async function createProduct(productData: any) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos para crear productos.' };
        }

        const { error } = await supabaseAdmin
            .from('soluciones_precios')
            .insert(productData);

        if (error) throw error;

        revalidatePath('/');
        revalidatePath('/sistemas');
        revalidatePath('/cotizador');
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message || 'Error al crear producto.' };
    }
}

export async function deleteProduct(id: string) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos para eliminar tarifas.' };
        }

        const { error } = await supabaseAdmin
            .from('soluciones_precios')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/');
        revalidatePath('/sistemas');
        revalidatePath('/cotizador');
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}

// --- Master Products (productos table) ---

export async function getMasterProducts() {
    try {
        const { data, error } = await supabaseAdmin
            .from('productos')
            .select('*')
            .order('orden', { ascending: true });

        // If table doesn't exist yet, return empty but descriptive error for UI to handle
        if (error) {
            if (error.code === '42P01') return { success: true, data: [], isLegacy: true };
            throw error;
        }
        return { success: true, data };
    } catch (err) {
        return { success: false, message: 'Error al cargar los productos maestros.' };
    }
}

export async function createMasterProduct(productData: any) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos.' };
        }

        const { error } = await supabaseAdmin
            .from('productos')
            .insert(productData);

        if (error) throw error;

        revalidatePath('/');
        revalidatePath('/sistemas');
        revalidatePath('/cotizador');
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}

export async function updateMasterProduct(id: string, updates: any) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos.' };
        }

        const { error } = await supabaseAdmin
            .from('productos')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        // Cascade changes to regional prices
        const cascadeUpdates: any = {};
        if (updates.title !== undefined) cascadeUpdates.title = updates.title;
        if (updates.category !== undefined) cascadeUpdates.category = updates.category;
        if (updates.grosor !== undefined) cascadeUpdates.grosor = updates.grosor;
        if (updates.beneficio_principal !== undefined) cascadeUpdates.beneficio_principal = updates.beneficio_principal;
        if (updates.detalle_costo_beneficio !== undefined) cascadeUpdates.detalle_costo_beneficio = updates.detalle_costo_beneficio;
        if (updates.orden !== undefined) cascadeUpdates.orden = updates.orden;
        if (updates.activo !== undefined) cascadeUpdates.activo = updates.activo;
        if (updates.internal_id !== undefined) cascadeUpdates.internal_id = updates.internal_id;

        if (Object.keys(cascadeUpdates).length > 0) {
            await supabaseAdmin
                .from('soluciones_precios')
                .update(cascadeUpdates)
                .eq('producto_id', id);
        }

        revalidatePath('/');
        revalidatePath('/sistemas');
        revalidatePath('/cotizador');
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}

export async function deleteMasterProduct(id: string) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos.' };
        }

        const { error } = await supabaseAdmin
            .from('productos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/');
        revalidatePath('/sistemas');
        revalidatePath('/cotizador');
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}
