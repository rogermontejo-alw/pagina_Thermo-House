/**
 * Generates an optimized Cloudinary URL with f_auto and q_auto.
 * Safe for use in Client Components.
 * 
 * @param publicId The public ID of the resource.
 * @param folder The folder path.
 * @param localFallback Optional local path to use if Cloudinary env var is missing.
 * @returns The optimized URL or the local fallback.
 */
export interface CloudinaryOptions {
    width?: number;
    height?: number;
    crop?: 'scale' | 'fit' | 'fill' | 'limit' | 'pad';
}

export const getCloudinaryUrl = (
    publicId: string,
    folder: string,
    localFallback?: string,
    options?: CloudinaryOptions
) => {
    // We can't access process.env server vars here easily unless they are NEXT_PUBLIC_
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!cloudName) {
        if (localFallback) return localFallback;
        console.warn('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set and no fallback provided');
        return '';
    }

    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    let cleanId = publicId;

    // Build transformation string
    let transforms = 'f_auto,q_auto';
    if (options) {
        if (options.width) transforms += `,w_${options.width}`;
        if (options.height) transforms += `,h_${options.height}`;
        if (options.crop) transforms += `,c_${options.crop}`;
        else if (options.width || options.height) transforms += ',c_limit'; // Default crop
    }

    const path = cleanFolder ? `${cleanFolder}/${cleanId}` : cleanId;
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${path}`;
};

export const getCloudinaryVideoUrl = (
    publicId: string,
    folder: string,
    localFallback?: string,
    options?: CloudinaryOptions
) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!cloudName) {
        if (localFallback) return localFallback;
        return '';
    }

    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');

    // Build transformation string
    let transforms = 'f_auto,q_auto';
    if (options) {
        if (options.width) transforms += `,w_${options.width}`;
        if (options.height) transforms += `,h_${options.height}`;
        if (options.crop) transforms += `,c_${options.crop}`;
        else if (options.width || options.height) transforms += ',c_limit'; // Default crop
    }

    const path = cleanFolder ? `${cleanFolder}/${publicId}` : publicId;
    return `https://res.cloudinary.com/${cloudName}/video/upload/${transforms}/${path}`;
}

/**
 * Ensures f_auto and q_auto are present in a full Cloudinary URL.
 * Useful for URLs stored in the database.
 */
export const optimizeCloudinaryUrl = (url: string) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    if (url.includes('f_auto') && url.includes('q_auto')) return url;

    // Direct match for standard upload URLs
    // https://res.cloudinary.com/cloud_name/image/upload/v12345/folder/id.jpg
    const parts = url.split('/upload/');
    if (parts.length === 2) {
        // If there's an existing transformation chunk, we might need more complex logic,
        // but for now let's handle the common case: no transformation or simple transformation.
        if (!parts[1].includes(',')) {
            // It might be just a version like v123/id
            return `${parts[0]}/upload/f_auto,q_auto/${parts[1]}`;
        }
    }
    return url;
};

