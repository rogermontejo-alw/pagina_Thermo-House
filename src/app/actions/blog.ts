'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from './admin-auth';
import { BlogPost } from '@/types';

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

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
