import crypto from 'crypto';

interface FacebookEventData {
    eventName: string;
    eventSourceUrl: string;
    userData: {
        email?: string;
        phone?: string;
        clientIpAddress?: string;
        clientUserAgent?: string;
        externalId?: string;
    };
    customData?: {
        value?: number;
        currency?: string;
        content_name?: string;
        status?: string;
    };
}

function hashData(data: string): string {
    if (!data) return '';
    return crypto
        .createHash('sha256')
        .update(data.trim().toLowerCase())
        .digest('hex');
}

export async function trackFacebookEvent({
    eventName,
    eventSourceUrl,
    userData,
    customData,
}: FacebookEventData) {
    const PIXEL_ID = process.env.FB_PIXEL_ID;
    const ACCESS_TOKEN = process.env.FB_CAPI_ACCESS_TOKEN;
    const TEST_CODE = process.env.FB_TEST_EVENT_CODE;

    if (!PIXEL_ID || !ACCESS_TOKEN) {
        console.error('Facebook CAPI: Missing credentials');
        return;
    }

    const eventTime = Math.floor(Date.now() / 1000);

    const payload = {
        data: [
            {
                event_name: eventName,
                event_time: eventTime,
                action_source: 'website',
                event_source_url: eventSourceUrl,
                user_data: {
                    em: userData.email ? [hashData(userData.email)] : undefined,
                    ph: userData.phone ? [hashData(userData.phone)] : undefined,
                    client_ip_address: userData.clientIpAddress,
                    client_user_agent: userData.clientUserAgent,
                    external_id: userData.externalId ? [hashData(userData.externalId)] : undefined,
                },
                custom_data: customData,
            },
        ],
        test_event_code: TEST_CODE || undefined,
    };

    try {
        const response = await fetch(
            `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        );

        const result = await response.json();
        if (result.error) {
            console.error('Facebook CAPI Error:', result.error);
        } else {
            console.log('Facebook CAPI Success:', result);
        }
        return result;
    } catch (error) {
        console.error('Facebook CAPI Fetch Error:', error);
    }
}
