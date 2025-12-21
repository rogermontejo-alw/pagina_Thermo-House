'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function saveQuote(prevState: any, formData: FormData) {
    try {
        const rawData = {
            name: formData.get('name') as string,
            phone: formData.get('phone') as string,
            email: formData.get('email') as string,
            area: Number(formData.get('area')),
            address: formData.get('address') as string,
            city: formData.get('city') as string,
            state: formData.get('state') as string,
            maps_link: formData.get('maps_link') as string,
            solutionId: formData.get('solutionId') as string,
            totalCash: Number(formData.get('totalCash')),
            totalMsi: Number(formData.get('totalMsi')),
        };

        // Basic Validation
        const errors: Record<string, string> = {};
        if (!rawData.name || rawData.name.length < 3) errors.name = 'El nombre es muy corto.';
        if (!rawData.area || rawData.area <= 0) {
            errors.area = 'El área medida debe ser mayor a 0.';
        }

        // At least one contact method required
        if (!rawData.phone && !rawData.email) {
            errors.phone = 'Ingresa WhatsApp o Correo.';
            errors.email = 'Ingresa WhatsApp o Correo.';
        } else if (rawData.phone) {
            // Clean phone number (keep only digits)
            const cleanPhone = rawData.phone.replace(/\D/g, '');
            if (cleanPhone.length !== 10) {
                errors.phone = 'El número debe tener exactamente 10 dígitos.';
            } else {
                // Update rawData with cleaned phone for DB consistency
                rawData.phone = cleanPhone;
            }
        }

        if (rawData.email && !rawData.email.includes('@')) {
            errors.email = 'Correo electrónico inválido.';
        }

        if (Object.keys(errors).length > 0) {
            return { success: false, errors, message: 'Por favor corrige los errores.' };
        }

        // Resolve Solution ID first, prioritizing the selected city
        const lookupCity = rawData.city || 'Mérida';
        let { data: solution, error: solError } = await supabaseAdmin
            .from('soluciones_precios')
            .select('id, internal_id')
            .eq('internal_id', rawData.solutionId)
            .eq('ciudad', lookupCity)
            .single();

        // Fallback to Merida if not found for specific city
        if ((solError || !solution) && lookupCity !== 'Mérida') {
            const fallback = await supabaseAdmin
                .from('soluciones_precios')
                .select('id, internal_id')
                .eq('internal_id', rawData.solutionId)
                .eq('ciudad', 'Mérida')
                .single();

            if (fallback.data) {
                solution = fallback.data;
                solError = null;
            }
        }

        if (solError || !solution) {
            console.error('CRITICAL: Solution ID resolution failed for:', rawData.solutionId, solError);
            return { success: false, message: `Error: No se encontró el sistema ${rawData.solutionId} para la ciudad ${lookupCity} en la base de datos.` };
        }

        // Final safety check for prices (Minimum 5900 MXN)
        const MIN_PRICE = 5900;
        const finalTotalCash = Math.max(rawData.totalCash || 0, MIN_PRICE);
        const finalTotalMsi = Math.max(rawData.totalMsi || 0, MIN_PRICE);

        console.log('Attempting to save quote to Supabase:', {
            name: rawData.name,
            area: rawData.area,
            system: solution.internal_id,
            totalCash: finalTotalCash
        });

        // Generate timestamp for Mexico City
        const cdmxDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Mexico_City',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(new Date()).replace(/,/g, '').replace(' ', 'T');

        // Insert into DB
        const { error: insertError } = await supabaseAdmin.from('cotizaciones').insert({
            address: rawData.address || 'Pendiente',
            ciudad: rawData.city || 'Mérida',
            estado: rawData.state || 'Yucatán',
            google_maps_link: rawData.maps_link || '',
            area: rawData.area,
            solution_id: solution.id,
            precio_total_contado: finalTotalCash,
            precio_total_msi: finalTotalMsi,
            contact_info: {
                name: rawData.name,
                phone: rawData.phone,
                email: rawData.email
            },
            status: 'Nuevo',
            created_at: cdmxDate
        });

        if (insertError) {
            console.error('Error creating quote in Supabase:', insertError);
            return { success: false, message: `Error al guardar: ${insertError.message}` };
        }

        // TODO: Send WhatsApp notification here using process.env.WHATSAPP_TOKEN

        return { success: true, message: 'Cotización guardada correctamente.' };

    } catch (err) {
        console.error('Unexpected error:', err);
        return { success: false, message: 'Error del servidor.' };
    }
}
