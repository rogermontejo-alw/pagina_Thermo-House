'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from './admin-auth';
import { BlogPost } from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Gets all published blog posts (Public).
 */
export async function getPublishedPosts() {
    try {
        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .select('*')
            .eq('is_published', true)
            .order('published_at', { ascending: false });

        if (error) {
            console.error('Error fetching blog posts:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data as BlogPost[] };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Gets a single blog post by its slug (Public).
 */
export async function getPostBySlug(slug: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            console.error('Error fetching blog post by slug:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data as BlogPost };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Admin: Gets all blog posts (published or not).
 */
export async function getAllPostsAdmin() {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: 'No autorizado' };

        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all posts admin:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data as BlogPost[] };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Admin: Creates a new blog post.
 */
export async function createBlogPost(post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: 'No autorizado' };

        // Ensure published_at is set if publishing
        const newPost = {
            ...post,
            author_id: session.id,
            published_at: post.is_published ? new Date().toISOString() : null
        };

        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .insert([newPost])
            .select()
            .single();

        if (error) {
            console.error('Error creating blog post:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/blog');
        revalidatePath('/');
        revalidatePath('/sistemas');
        revalidatePath('/garantia');
        revalidatePath('/sucursales');
        revalidatePath('/cotizador');
        return { success: true, data: data as BlogPost };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Admin: Updates an existing blog post.
 */
export async function updateBlogPost(id: string, updates: Partial<BlogPost>) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: 'No autorizado' };

        const { data: currentPost } = await supabaseAdmin.from('blog_posts').select('is_published').eq('id', id).single();

        let finalUpdates = { ...updates };
        // Set published_at if state changed to published
        if (updates.is_published && !currentPost?.is_published) {
            finalUpdates.published_at = new Date().toISOString();
        }

        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .update(finalUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating blog post:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/blog');
        revalidatePath(`/blog/${data.slug}`);
        revalidatePath('/');
        revalidatePath('/sistemas');
        revalidatePath('/garantia');
        revalidatePath('/sucursales');
        revalidatePath('/cotizador');
        return { success: true, data: data as BlogPost };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Admin: Deletes a blog post.
 */
export async function deleteBlogPost(id: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: 'No autorizado' };

        const { error } = await supabaseAdmin
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting blog post:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/blog');
        revalidatePath('/');
        revalidatePath('/sistemas');
        revalidatePath('/garantia');
        revalidatePath('/sucursales');
        revalidatePath('/cotizador');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Admin: Uploads an image to storage.
 */
/**
 * Admin: Uploads an image to Cloudinary.
 */
export async function uploadBlogImage(formData: FormData) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: 'No autorizado' };

        const file = formData.get('file') as File;
        if (!file) return { success: false, error: 'No se recibio ningún archivo' };

        const buffer = await file.arrayBuffer();
        const bytes = Buffer.from(buffer);

        // Upload to Cloudinary
        // Note: We need to import cloudinary from our lib which is already configured
        const { default: cloudinary } = await import('@/lib/cloudinary');

        const result = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'blog',
                    resource_type: 'auto', // Detects image/video/etc
                    transformation: [
                        { quality: 'auto', fetch_format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            // Write buffer to stream
            const Readable = require('stream').Readable;
            const stream = new Readable();
            stream.push(bytes);
            stream.push(null);
            stream.pipe(uploadStream);
        });

        // The user wants specifically the optimized URL. 
        // Cloudinary result.secure_url is usually the base one.
        // But we applied transformation in upload, so the incoming URL might have it?
        // Actually, 'transformation' in upload_stream applies to the *incoming* asset if 'eager' involved or creates derived.
        // It's safer to just return the secure_url.
        // However, the user said: "in supabase se suba solamente la liga".
        // And "considera siempre optimizar esa liga".
        // If I use `getCloudinaryUrl` helper here I could just return that.
        // But result.secure_url is standard.
        // Let's ensure we return the URL with f_auto,q_auto.
        // Since we added transformation in options, the stored original might be okay, but the URL we want to USE is the dynamic one.
        // Actually, keeping original as backup and using dynamic transformation on read is best practice.
        // But here we are storing the URL string in the DB.

        // Let's construct the optimized URL from the public_id to be sure.
        // Cloudinary result returns `public_id`, `version`, `format`.

        // Let's just return result.secure_url but inject f_auto,q_auto if not present?
        // Actually, if we use the helper logic:
        // https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto/v<version>/<public_id>.<format>

        // Simply returning the result from upload is safest if we want the "raw" reference, 
        // but the prompt asked to store the optimized one or optimized it.
        // "en supabase se suba solamente la liga... optimice con f-auto y q-auto"

        // I will use cloudinary.url() helper to generate it.
        const optimizedUrl = cloudinary.url(result.public_id, {
            fetch_format: 'auto',
            quality: 'auto',
            secure: true
        });

        return { success: true, url: optimizedUrl };
    } catch (err: any) {
        console.error('Critical error in uploadBlogImage:', err);
        return { success: false, error: err.message };
    }
}
