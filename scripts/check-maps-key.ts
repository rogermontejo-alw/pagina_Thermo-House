
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const main = () => {
    const key1 = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const key2 = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    console.log('--- Checking Google Maps Keys ---');
    console.log('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:', key1 ? `Exists (starts with ${key1.substring(0, 5)}...)` : 'Missing');
    console.log('NEXT_PUBLIC_GOOGLE_MAPS_KEY:', key2 ? `Exists (starts with ${key2.substring(0, 5)}...)` : 'Missing');

    if (!key1 && !key2) {
        console.error('❌ NO GOOGLE MAPS KEY FOUND');
    } else {
        console.log('✅ Key found. Ensure it has "Maps JavaScript API", "Places API", and "Drawing SDK" enabled in Google Cloud Console.');
    }
};

main();
