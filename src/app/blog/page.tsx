import { getPublishedPosts } from '@/app/actions/blog';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BlogListing from '@/components/BlogListing';

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
                        <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.25em] rounded-full mb-4">
                                Biblioteca de Soluciones
                            </span>
                            <h1 className="text-4xl md:text-6xl font-black text-secondary dark:text-white uppercase tracking-tight leading-none mb-6">
                                Blog <span className="text-primary italic">Thermo</span> House
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-lg font-medium leading-relaxed">
                                Encuentra respuestas rápidas sobre mantenimiento, ahorro energético y técnicas de impermeabilización profesional.
                            </p>
                        </div>
                    </div>

                    <BlogListing initialPosts={posts} />
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 mt-auto">
                <Footer />
            </div>
        </main>
    );
}

const FileText = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
);
