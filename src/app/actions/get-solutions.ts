'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { Solution } from '@/types';

export async function getAllSolutions() {
    try {
        const { data, error } = await supabaseAdmin
            .from('soluciones_precios')
            .select('*')
            .order('orden', { ascending: true });

        if (error) {
            console.error('Error fetching solutions:', error);
            return { success: false, data: [] };
        }

        return { success: true, data: data as Solution[] };
    } catch (error) {
        console.error('Unexpected error in getAllSolutions:', error);
        return { success: false, data: [] };
    }
}
