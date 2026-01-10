import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary (Server-side usage generally, but client can use the helper)
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

/**
 * Generates an optimized Cloudinary URL with f_auto and q_auto.
 * @param publicId The public ID of the resource (filename without extension usually).
 * @param folder The folder path (e.g., 'Home Page', 'blog').
 * @returns The optimized URL.
 */
export const getCloudinaryUrl = (publicId: string, folder: string) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
        console.warn('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set');
        // Maintain local fallback logic or return a placeholder if needed, 
        // but here we return the structured URL expecting the env var to be there.
    }

    // Ensure folder doesn't have leading/trailing slashes if we are concatenating manually
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    // Clean publicId - if it's a full URL or has slashes, we might need to be careful, 
    // but usually for this specific task it's a filename/ID.

    // Format: https://res.cloudinary.com/<cloud_name>/image/upload/f_auto,q_auto/<folder>/<public_id>
    // We specifically asked for image optimization. For video, resource type should be 'video'.
    // But the prompt specifically said "Crea una función... que retorne la URL optimizada".
    // It will likely be used for images based on the 'f_auto,q_auto' requirement which is typical for images.
    // For videos, 'f_auto,q_auto' also works but the resource type URL segment is 'video' instead of 'image'.
    // I will assume defaults to 'image' for now as 'getCloudinaryUrl' name implies general usage, 
    // but if needed for video I might need a 'resourceType' param. 
    // Given the specific instruction "Crea una función... que reciba el public_id y la carpeta", 
    // I will stick to that signature.

    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${cleanFolder}/${publicId}`;
};

export const getCloudinaryVideoUrl = (publicId: string, folder: string) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    return `https://res.cloudinary.com/${cloudName}/video/upload/f_auto,q_auto/${cleanFolder}/${publicId}`;
}

export default cloudinary;
