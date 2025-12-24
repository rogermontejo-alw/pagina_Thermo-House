import { getPublishedPosts } from '@/app/actions/blog';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SectionWrapper from '@/components/SectionWrapper';
import Link from 'next/link';
import { Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
    title: 'Blog | Thermo House - Consejos de Impermeabilización',
    description: 'Expertos compartiendo consejos sobre impermeabilización térmica, mantenimiento de techos y soluciones con poliuretano.'
};

export default async function BlogPage() {
    const res = await getPublishedPosts();
    const posts = res.success ? res.data || [] : [];

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 pb-20">
            <Navbar />

            <div className="pt-32 pb-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.25em] rounded-full mb-4">
                                Noticias y Consejos
                            </span>
                            <h1 className="text-4xl md:text-6xl font-black text-secondary dark:text-white uppercase tracking-tight leading-none mb-6">
                                Blog <span className="text-primary italic">Thermo</span> House
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-lg font-medium leading-relaxed">
                                Descubre artículos técnicos, guías de mantenimiento y las últimas innovaciones en blindaje térmico para proteger tu hogar o industria.
                            </p>
                        </div>
                    </div>

                    {posts.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {posts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col h-full"
                                >
                                    <div className="relative aspect-[16/10] overflow-hidden">
                                        {post.image_url ? (
                                            <Image
                                                src={post.image_url}
                                                alt={post.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <span className="text-slate-300 dark:text-slate-700 font-black text-4xl italic">TH</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <div className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-100 dark:border-slate-800">
                                                <Calendar className="w-3 h-3 text-primary" />
                                                {new Date(post.published_at!).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                            </div>
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
                        <div className="py-24 text-center">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-8 h-8 text-slate-300" />
                            </div>
                            <h2 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight mb-2">Próximamente</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium italic">Estamos preparando contenido de alta calidad para ti.</p>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    );
}

const FileText = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
);
