import { getPostBySlug, getPublishedPosts } from '@/app/actions/blog';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Calendar, ArrowLeft, Clock, Share2, Facebook, Twitter, LinkIcon, Tag } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const res = await getPostBySlug(params.slug);
    if (!res.success || !res.data) return { title: 'Post No Encontrado' };

    const post = res.data;
    return {
        title: `${post.title} | Blog Thermo House`,
        description: post.subtitle,
        openGraph: {
            title: post.title,
            description: post.subtitle,
            images: post.image_url ? [post.image_url] : [],
        }
    };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    const res = await getPostBySlug(params.slug);

    if (!res.success || !res.data) {
        notFound();
    }

    const post = res.data;

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <Navbar />

            <div className="pt-32 pb-24 px-6">
                <article className="max-w-4xl mx-auto">
                    {/* Breadcrumbs / Back */}
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest mb-8 hover:-translate-x-1 transition-transform"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al Blog
                    </Link>

                    {/* Header */}
                    <div className="mb-12">
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.25em] rounded-full">
                                {new Date(post.published_at!).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            {post.category && (
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary dark:bg-slate-800 text-white dark:text-slate-300 text-[10px] font-black uppercase tracking-[0.25em] rounded-full">
                                    <Tag className="w-3 h-3 text-primary" />
                                    {post.category === 'ahorro-energetico' ? 'Ahorro Energético' :
                                        post.category === 'guias-tecnicas' ? 'Guías Técnicas' :
                                            post.category === 'costos-presupuestos' ? 'Costos y Presupuestos' :
                                                post.category === 'casos-exito' ? 'Casos de Éxito' : 'Mantenimiento'}
                                </span>
                            )}
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest ml-auto md:ml-0">
                                <Clock className="w-3.5 h-3.5" />
                                {Math.ceil(post.content.split(' ').length / 200)} min lectura
                            </div>
                        </div>

                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-secondary dark:text-white uppercase tracking-tight leading-tight mb-8">
                            {post.title}
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic border-l-4 border-primary pl-6">
                            {post.subtitle}
                        </p>
                    </div>

                    {/* Main Image */}
                    {post.image_url && (
                        <div className="relative aspect-[21/9] rounded-[3rem] overflow-hidden mb-16 border border-slate-100 dark:border-slate-800 shadow-2xl">
                            <Image
                                src={post.image_url}
                                alt={post.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-12 lg:p-16 border border-slate-100 dark:border-slate-800 shadow-xl mb-16">
                        <div
                            className="prose prose-slate dark:prose-invert max-w-none 
                            prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                            prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:text-lg prose-p:leading-relaxed
                            prose-strong:text-secondary dark:prose-strong:text-white
                            prose-img:rounded-3xl"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </div>

                    {/* Footer / Sharing */}
                    <div className="pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Compartir artículo</h4>
                            <div className="flex gap-4">
                                <button className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all">
                                    <Facebook className="w-5 h-5" />
                                </button>
                                <button className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all">
                                    <Twitter className="w-5 h-5" />
                                </button>
                                <button className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all">
                                    <LinkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col md:items-end">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 font-medium italic">Thermo House Waterproofing</h4>
                            <p className="text-secondary dark:text-white font-black text-sm uppercase">Cuidando tu patrimonio para siempre.</p>
                        </div>
                    </div>
                </article>
            </div>

            <Footer />
        </main>
    );
}

// Ensure dynamic routes work
export async function generateStaticParams() {
    const res = await getPublishedPosts();
    if (!res.success || !res.data) return [];
    return res.data.map((post) => ({
        slug: post.slug,
    }));
}
