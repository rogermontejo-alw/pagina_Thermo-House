'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Edit3, Trash2, Globe, Eye, EyeOff, Calendar,
    Image as ImageIcon, FileText, ChevronRight, X, Save, ArrowLeft, Tag
} from 'lucide-react';
import {
    getAllPostsAdmin,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    uploadBlogImage
} from '@/app/actions/blog';
import { BlogPost } from '@/types';
import { supabase } from '@/lib/supabase';

export default function BlogManager() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState<Partial<BlogPost> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const categories = [
        { id: 'mantenimiento', name: 'Mantenimiento' },
        { id: 'ahorro-energetico', name: 'Ahorro Energético' },
        { id: 'guias-tecnicas', name: 'Guías Técnicas' },
        { id: 'costos-presupuestos', name: 'Costos y Presupuestos' },
        { id: 'casos-exito', name: 'Casos de Éxito' }
    ];

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        setLoading(true);
        const res = await getAllPostsAdmin();
        if (res.success && res.data) {
            setPosts(res.data);
        }
        setLoading(false);
    };

    const handleNewPost = () => {
        setCurrentPost({
            title: '',
            subtitle: '',
            content: '',
            slug: '',
            image_url: '',
            category: 'mantenimiento',
            is_published: false
        });
        setIsEditing(true);
    };

    const handleEditPost = (post: BlogPost) => {
        setCurrentPost(post);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!currentPost?.title || !currentPost?.content || !currentPost?.slug) {
            alert('Título, Slug y Contenido son obligatorios.');
            return;
        }

        setIsSaving(true);
        let res;
        if (currentPost.id) {
            res = await updateBlogPost(currentPost.id, currentPost);
        } else {
            res = await createBlogPost(currentPost as Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>);
        }

        if (res.success) {
            await loadPosts();
            setIsEditing(false);
            setCurrentPost(null);
        } else {
            alert('Error al guardar: ' + res.error);
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este artículo?')) return;
        const res = await deleteBlogPost(id);
        if (res.success) {
            loadPosts();
        } else {
            alert('Error al eliminar');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
        let file: File | undefined;

        if ('files' in e.target && e.target.files) {
            file = e.target.files[0];
        } else if ('dataTransfer' in e && e.dataTransfer.files) {
            file = e.dataTransfer.files[0];
        }

        if (!file) return;

        // Validar formato
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            alert('Por favor selecciona una imagen válida (JPG, PNG, WebP, AVIF, GIF).');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const res = await uploadBlogImage(formData);

            if (res.success && res.url) {
                setCurrentPost({ ...currentPost, image_url: res.url });
                alert('Imagen subida con éxito.');
            } else {
                throw new Error(res.error || 'Error desconocido');
            }
        } catch (error: any) {
            alert('Error subiendo imagen: ' + error.message);
        } finally {
            setUploading(false);
            setIsDragging(false);
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        handleFileUpload(e);
    };

    const filteredPosts = posts.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isEditing) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
            >
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Volver al listado
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-primary text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 disabled:opacity-50"
                        >
                            {isSaving ? 'Guardando...' : <><Save className="w-4 h-4" /> Guardar Cambios</>}
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" /> Contenido del Artículo
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={currentPost?.title || ''}
                                        onChange={e => setCurrentPost({ ...currentPost, title: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 focus:ring-2 ring-primary"
                                        placeholder="Ej: Por qué el poliuretano es mejor que el tradicional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">Subtítulo / Resumen</label>
                                    <textarea
                                        value={currentPost?.subtitle || ''}
                                        onChange={e => setCurrentPost({ ...currentPost, subtitle: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 focus:ring-2 ring-primary h-20"
                                        placeholder="Breve descripción para el listado..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">Contenido (Markdown / HTML)</label>
                                    <textarea
                                        value={currentPost?.content || ''}
                                        onChange={e => setCurrentPost({ ...currentPost, content: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 focus:ring-2 ring-primary h-96 font-mono text-sm"
                                        placeholder="Escribe aquí tu artículo..."
                                    />
                                    <div className="flex justify-end pt-2">
                                        <label className="cursor-pointer group">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 group-hover:text-primary transition-colors">
                                                <ImageIcon className="w-3 h-3" />
                                                {uploading ? 'Subiendo...' : 'Subir imagen para el contenido y copiar link'}
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    setUploading(true);
                                                    try {
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        const res = await uploadBlogImage(formData);
                                                        if (!res.success || !res.url) throw new Error(res.error);

                                                        // Copiar al portapapeles
                                                        await navigator.clipboard.writeText(res.url);
                                                        alert('¡URL de imagen para contenido copiada!');
                                                    } catch (err: any) {
                                                        alert('Error: ' + err.message);
                                                    } finally {
                                                        setUploading(false);
                                                    }
                                                }}
                                                disabled={uploading}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-primary" /> Configuración
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">URL (Slug)</label>
                                    <input
                                        type="text"
                                        value={currentPost?.slug || ''}
                                        onChange={e => setCurrentPost({ ...currentPost, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 focus:ring-2 ring-primary font-mono text-xs"
                                        placeholder="ej-articulo-informativo"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">Imagen de Portada</label>
                                    <div className="space-y-3">
                                        {currentPost?.image_url ? (
                                            <div className="relative group rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 aspect-video bg-slate-50 dark:bg-slate-900">
                                                <img
                                                    src={currentPost.image_url}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setCurrentPost({ ...currentPost, image_url: '' })}
                                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                                                        title="Eliminar imagen"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/30">
                                                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-3 text-slate-400">
                                                    <ImageIcon className="w-8 h-8" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-500 mb-1">No hay imagen de portada</p>
                                                <p className="text-[10px] text-slate-400 mb-4 uppercase font-bold tracking-tighter">Formatos recomendados: WebP o AVIF</p>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <label className="flex-1">
                                                <div
                                                    onDragOver={onDragOver}
                                                    onDragLeave={onDragLeave}
                                                    onDrop={onDrop}
                                                    className={`w-full bg-slate-50 dark:bg-slate-900 border-2 border-dashed rounded-xl p-3 text-center text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 ${isDragging ? 'border-primary bg-primary/5 text-primary' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'} ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <ImageIcon className="w-4 h-4" />
                                                    {uploading ? 'Subiendo...' : isDragging ? '¡Suelta la imagen!' : currentPost?.image_url ? 'Cambiar Imagen' : 'Subir o Arrastrar'}
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                    disabled={uploading}
                                                />
                                            </label>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">O usar una URL externa</label>
                                            <input
                                                type="text"
                                                value={currentPost?.image_url || ''}
                                                onChange={e => {
                                                    let val = e.target.value;
                                                    // Auto-optimize Cloudinary URLs if missing params
                                                    if (val.includes('cloudinary.com') && val.includes('/upload/') && !val.includes('f_auto')) {
                                                        val = val.replace('/upload/', '/upload/f_auto,q_auto/');
                                                    }
                                                    setCurrentPost({ ...currentPost, image_url: val });
                                                }}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-2 focus:ring-2 ring-primary text-[10px] font-mono"
                                                placeholder="https://externa.com/imagen.jpg"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">Categoría</label>
                                    <select
                                        value={currentPost?.category || 'mantenimiento'}
                                        onChange={e => setCurrentPost({ ...currentPost, category: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 focus:ring-2 ring-primary text-xs font-bold"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                    <span className="text-sm font-bold">Publicado</span>
                                    <button
                                        onClick={() => setCurrentPost({ ...currentPost, is_published: !currentPost?.is_published })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${currentPost?.is_published ? 'bg-green-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currentPost?.is_published ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar artículos..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border-none pl-10 pr-4 py-2 rounded-xl focus:ring-2 ring-primary transition-all shadow-sm"
                    />
                </div>
                <button
                    onClick={handleNewPost}
                    className="bg-primary text-white px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Nueva Entrada
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Post</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-center">Estado</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Fecha</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredPosts.map(post => (
                                <tr key={post.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            {post.image_url ? (
                                                <img src={post.image_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                                    <ImageIcon className="w-5 h-5 text-slate-300" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white line-clamp-1">{post.title}</p>
                                                <p className="text-xs text-slate-400 font-mono">/{post.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {post.is_published ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[10px] font-black uppercase">
                                                    <Eye className="w-3 h-3" /> Publicado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-900/50 text-slate-500 rounded-full text-[10px] font-black uppercase">
                                                    <EyeOff className="w-3 h-3" /> Borrador
                                                </span>
                                            )}
                                            {post.category && (
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {categories.find(c => c.id === post.category)?.name || post.category}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(post.published_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEditPost(post)}
                                                className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredPosts.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        No se encontraron artículos. ¡Crea el primero!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
