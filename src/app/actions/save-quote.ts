'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from './admin-auth';

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
            isOutOfZone: formData.get('isOutOfZone') === 'true',
            postalCode: formData.get('postalCode') as string,
            pricing_type: formData.get('pricing_type') as string || 'contado',
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
            console.warn('[SAVE] Validation failed:', errors);
            return { success: false, errors, message: 'Por favor corrige los errores.' };
        }

        // Normalize helper
        const norm = (c: string) => c.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const targetCityNorm = norm(rawData.city || 'Mérida');
        const meridaNorm = norm('Mérida');

        // Fetch all possible variations for this internal_id
        const { data: allSols, error: solError } = await supabaseAdmin
            .from('soluciones_precios')
            .select('id, internal_id, ciudad')
            .eq('internal_id', rawData.solutionId);

        if (solError || !allSols || allSols.length === 0) {
            console.error('CRITICAL: No solutions found for:', rawData.solutionId);
            return { success: false, message: `Error: No se encontró el sistema ${rawData.solutionId} en el catálogo base.` };
        }

        // 1. Try to find the specific city match
        let solution = allSols.find(s => s.ciudad && norm(s.ciudad) === targetCityNorm);

        // 2. If not found and not already Mérida, try to find Mérida fallback
        if (!solution && targetCityNorm !== meridaNorm) {
            solution = allSols.find(s => s.ciudad && norm(s.ciudad) === meridaNorm);
        }

        // 3. Last resort: just take any if still missing (shouldn't happen with Mérida default)
        if (!solution) solution = allSols[0];


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

        // Detect creator (if logged in)
        const session = await getAdminSession();
        const createdBy = session?.id || null;

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
            created_at: cdmxDate,
            notas: rawData.isOutOfZone ? '⚠️ ZONA FORÁNEA: El cliente cotizó fuera de Mérida. Revisar costos de logística.' : '',
            is_out_of_zone: rawData.isOutOfZone,
            created_by: createdBy,
            postal_code: rawData.postalCode || '',
            pricing_type: rawData.pricing_type
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
