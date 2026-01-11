'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from './admin-auth';
import { headers } from 'next/headers';
import { trackFacebookEvent } from '@/lib/facebook-capi';

export async function saveQuote(prevState: any, formData: FormData) {
    try {
        const quoteId = formData.get('quoteId') as string;
        const lastStep = formData.get('last_step') as string || 'finalizado';

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
            totalCash: Number(formData.get('totalCash') || formData.get('conversion_value')),
            totalMsi: Number(formData.get('totalMsi')),
            isOutOfZone: formData.get('isOutOfZone') === 'true',
            postalCode: formData.get('postalCode') as string,
            pricing_type: formData.get('pricing_type') as string || 'contado',
            utm_source: formData.get('utm_source') as string || null,
            utm_medium: formData.get('utm_medium') as string || null,
            utm_campaign: formData.get('utm_campaign') as string || null,
            utm_term: formData.get('utm_term') as string || null,
            utm_content: formData.get('utm_content') as string || null,
            referrer: formData.get('referrer') as string || null,
        };

        // Basic Validation
        const errors: Record<string, string> = {};
        if (!rawData.name || rawData.name.length < 3) errors.name = 'El nombre es muy corto.';

        // Validation for Area (only skip if we are just saving contact info draft)
        if (lastStep !== 'datos_contacto' && (!rawData.area || rawData.area <= 0)) {
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
                errors.phone = 'El WhatsApp debe tener exactamente 10 dígitos.';
            } else {
                rawData.phone = cleanPhone;
            }
        }

        if (rawData.email && !rawData.email.includes('@')) {
            errors.email = 'Correo electrónico inválido.';
        }

        if (Object.keys(errors).length > 0) {
            return { success: false, errors, message: 'Por favor corrige los errores.' };
        }

        // Normalize helper
        const norm = (c: string) => c.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const targetCityNorm = norm(rawData.city || 'Mérida');
        const meridaNorm = norm('Mérida');

        // Fetch solution data
        const { data: allSols } = await supabaseAdmin
            .from('soluciones_precios')
            .select('id, internal_id, ciudad')
            .eq('internal_id', rawData.solutionId);

        let solution = null;
        if (allSols && allSols.length > 0) {
            solution = allSols.find(s => s.ciudad && norm(s.ciudad) === targetCityNorm) ||
                allSols.find(s => s.ciudad && norm(s.ciudad) === meridaNorm) ||
                allSols[0];
        }

        // Prices
        const finalTotalCash = rawData.totalCash || 0;
        const finalTotalMsi = rawData.totalMsi || 0;

        // Detecting creator
        const session = await getAdminSession();
        const createdBy = session?.id || null;

        const quotePayload = {
            address: rawData.address || 'Pendiente',
            ciudad: rawData.city || 'Mérida',
            estado: rawData.state || 'Yucatán',
            google_maps_link: rawData.maps_link || '',
            area: rawData.area,
            solution_id: solution?.id || null,
            precio_total_contado: finalTotalCash,
            precio_total_msi: finalTotalMsi,
            contact_info: {
                name: rawData.name,
                phone: rawData.phone,
                email: rawData.email,
                last_step: lastStep // Guardado dentro del JSON como respaldo
            },
            status: lastStep === 'datos_contacto' ? 'Borrador' : 'Nuevo',
            last_step: lastStep,
            conversion_value: finalTotalCash,
            created_at: new Date().toISOString(),
            notas: rawData.isOutOfZone ? '⚠️ ZONA FORÁNEA' : '',
            is_out_of_zone: rawData.isOutOfZone,
            created_by: createdBy,
            postal_code: rawData.postalCode || '',
            pricing_type: rawData.pricing_type,
            utm_source: rawData.utm_source,
            utm_medium: rawData.utm_medium,
            utm_campaign: rawData.utm_campaign,
            utm_term: rawData.utm_term,
            utm_content: rawData.utm_content,
            referrer: rawData.referrer
        };

        let result;
        if (quoteId) {
            // Update existing draft
            result = await supabaseAdmin
                .from('cotizaciones')
                .update(quotePayload)
                .eq('id', quoteId)
                .select('id')
                .single();
        } else {
            // Insert new record
            result = await supabaseAdmin
                .from('cotizaciones')
                .insert(quotePayload)
                .select('id')
                .single();
        }

        if (result.error) {
            console.error('Error in Supabase operation:', result.error);
            return { success: false, message: `Error: ${result.error.message}` };
        }

        if (!result.error) {
            const finalId = result.data?.id || quoteId;

            // Background Facebook CAPI tracking
            const headersList = await headers();
            const clientIp = headersList.get('x-forwarded-for')?.split(',')[0] || headersList.get('x-real-ip') || '';
            const userAgent = headersList.get('user-agent') || '';

            try {
                // We await here to ensure Vercel/Serverless doesn't terminate before the fetch completes
                await trackFacebookEvent({
                    eventName: 'Lead',
                    eventSourceUrl: 'https://thermohouse.mx/cotizador',
                    userData: {
                        email: rawData.email,
                        phone: rawData.phone,
                        clientIpAddress: clientIp,
                        clientUserAgent: userAgent,
                        externalId: finalId
                    },
                    customData: {
                        value: finalTotalCash,
                        currency: 'MXN',
                        content_name: rawData.solutionId || 'Sistema Thermo House',
                        status: lastStep === 'datos_contacto' ? 'Draft' : 'Finalized'
                    }
                });
            } catch (e) {
                console.error('CAPI Error:', e);
            }
        }

        return {
            success: true,
            message: lastStep === 'datos_contacto' ? 'Borrador iniciado' : 'Cotización guardada correctamente.',
            quoteId: result.data.id || quoteId
        };

        // TODO: Send WhatsApp notification here using process.env.WHATSAPP_TOKEN

        return { success: true, message: 'Cotización guardada correctamente.' };

    } catch (err) {
        console.error('Unexpected error:', err);
        return { success: false, message: 'Error del servidor.' };
    }
}
