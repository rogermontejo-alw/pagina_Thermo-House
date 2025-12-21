'use server'

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export interface Cotizacion {
    id: string;
    created_at: string;
    nombre_cliente: string;
    telefono: string;
    email: string;
    ciudad: string;
    metros_cuadrados: number;
    solucion_seleccionada: string;
    precio_total_contado: number;
    precio_total_msi: number;
    status: 'Nuevo' | 'Contactado' | 'Visita Técnica' | 'Cerrado';
}

export interface PrecioCiudad {
    id: string;
    ciudad: string;
    internal_id: string;
    title: string;
    precio_contado_m2: number;
    precio_msi_m2: number;
}

export async function getCotizaciones() {
    const { data, error } = await supabaseAdmin
        .from('cotizaciones')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching quotes:', error);
        return [];
    }

    // Robust mapping for JSONB or flat columns
    return data.map((d: any) => ({
        id: d.id,
        created_at: d.created_at,
        nombre_cliente: d.nombre_cliente || d.contact_info?.name || d.contact_info?.nombre || 'Cliente',
        telefono: d.telefono || d.contact_info?.phone || d.contact_info?.telefono || '',
        email: d.email || d.contact_info?.email || '',
        ciudad: d.ciudad || d.contact_info?.city || d.address || 'Desconocido',
        metros_cuadrados: d.metros_cuadrados || d.area || 0,
        solucion_seleccionada: d.solucion_seleccionada || (typeof d.solution_id === 'string' ? d.solution_id : 'N/A'),
        precio_total_contado: d.precio_total_contado,
        precio_total_msi: d.precio_total_msi,
        status: d.status || 'Nuevo'
    })) as Cotizacion[];
}

export async function updateCotizacionStatus(id: string, status: string) {
    const { error } = await supabaseAdmin
        .from('cotizaciones')
        .update({ status })
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/admin');
}

export async function getPrecios() {
    const { data, error } = await supabaseAdmin
        .from('soluciones_precios')
        .select('*')
        .order('ciudad', { ascending: true });

    if (error) {
        console.error('Error fetching prices:', error);
        return [];
    }
    return data as PrecioCiudad[];
}

export async function updatePrecio(id: string, precio_contado_m2: number) {
    const precio_msi_m2 = Math.round(precio_contado_m2 / 0.84);

    const { error } = await supabaseAdmin
        .from('soluciones_precios')
        .update({ precio_contado_m2, precio_msi_m2 })
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/admin');
}
