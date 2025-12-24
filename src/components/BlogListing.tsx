'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ChevronRight, Search, Tag } from 'lucide-react';
import { BlogPost } from '@/types';

interface BlogListingProps {
    initialPosts: BlogPost[];
}

export default function BlogListing({ initialPosts }: BlogListingProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');

    const categories = [
        { id: 'all', name: 'Todos' },
        { id: 'mantenimiento', name: 'Mantenimiento' },
        { id: 'ahorro-energetico', name: 'Ahorro Energético' },
        { id: 'guias-tecnicas', name: 'Guías Técnicas' },
        { id: 'costos-presupuestos', name: 'Costos y Presupuestos' },
        { id: 'casos-exito', name: 'Casos de Éxito' }
    ];

    const filteredPosts = initialPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-12">
            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-start">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            aria-label={`Filtrar por ${cat.name}`}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-secondary dark:hover:text-white'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:max-w-xs">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por tema..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-none pl-12 pr-4 py-3 rounded-2xl text-sm focus:ring-2 ring-primary transition-all"
                    />
                </div>
            </div>

            {/* Results */}
            {filteredPosts.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.map((post) => (
                        <Link
                            key={post.id}
                            href={`/blog/${post.slug}`}
                            className="group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500"
                        >
                            <div className="relative aspect-[16/10] overflow-hidden">
                                {post.image_url ? (
                                    <img
                                        src={post.image_url}
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <span className="text-slate-300 dark:text-slate-700 font-black text-4xl italic">TH</span>
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <div className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-100 dark:border-slate-800">
                                        <Calendar className="w-3 h-3 text-primary" />
                                        {new Date(post.published_at!).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                    </div>
                                    {post.category && (
                                        <div className="px-3 py-1 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20">
                                            <Tag className="w-3 h-3" />
                                            {categories.find(c => c.id === post.category)?.name || post.category}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 flex flex-col flex-1">
                                <h3 className="text-xl font-black text-secondary dark:text-white leading-tight mb-4 group-hover:text-primary transition-colors line-clamp-2 uppercase">
                                    {post.title}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium line-clamp-3 mb-6 flex-1">
                                    {post.subtitle}
                                </p>
                                <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest pt-4 border-t border-slate-50 dark:border-slate-800">
                                    Leer Artículo <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center bg-white dark:bg-slate-900/40 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h2 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight mb-2">Sin resultados</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic">No encontramos artículos que coincidan con tu búsqueda o filtro.</p>
                    <button
                        onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}
                        className="mt-6 text-primary font-black uppercase text-xs tracking-widest hover:underline"
                    >
                        Ver todos los artículos
                    </button>
                </div>
            )}
        </div>
    );
}
