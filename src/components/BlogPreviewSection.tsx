'use server';

import { getPublishedPosts } from '@/app/actions/blog';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Calendar } from 'lucide-react';

export default async function BlogPreviewSection() {
    const res = await getPublishedPosts();
    const posts = res.success ? (res.data || []).slice(0, 3) : [];

    if (posts.length === 0) return null;

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.25em] rounded-full mb-4">
                        Centro de Conocimiento
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black text-secondary dark:text-white uppercase tracking-tight leading-none">
                        Último en el <span className="text-primary italic">Blog</span>
                    </h2>
                </div>
                <Link
                    href="/blog"
                    className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest hover:translate-x-1 transition-transform"
                >
                    Ver todas las entradas <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {posts.map((post) => (
                    <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="group flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500"
                    >
                        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                            {post.image_url ? (
                                <Image
                                    src={post.image_url}
                                    alt={post.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-2xl italic">TH</div>
                            )}
                            <div className="absolute top-4 left-4">
                                <div className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <Calendar className="w-3 h-3 text-primary" />
                                    {new Date(post.published_at!).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 flex flex-col flex-1">
                            <h3 className="text-lg font-black text-secondary dark:text-white uppercase leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
                                {post.title}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium line-clamp-2 mb-6 flex-1">
                                {post.subtitle}
                            </p>
                            <div className="flex items-center gap-1 text-primary text-[10px] font-black uppercase tracking-widest">
                                Leer más <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
