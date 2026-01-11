'use client';

import { Facebook, LinkIcon, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Toast from './Toast';

interface BlogShareSectionProps {
    slug: string;
    title: string;
}

export default function BlogShareSection({ slug, title }: BlogShareSectionProps) {
    const url = `https://thermohouse.mx/blog/${slug}`;
    const [showToast, setShowToast] = useState(false);
    const [isMobileShare, setIsMobileShare] = useState(false);

    useEffect(() => {
        const checkMobileShare = () => {
            const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
            const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
            const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 1024;

            setIsMobileShare(hasNativeShare && (isTouchDevice || isSmallScreen));
        };

        checkMobileShare();
        window.addEventListener('resize', checkMobileShare);
        return () => window.removeEventListener('resize', checkMobileShare);
    }, []);

    const handleShare = async () => {
        try {
            await navigator.share({
                title: title,
                text: `Lee este artículo de Thermo House: ${title}`,
                url: url,
            });
        } catch (error) {
            console.log('Error sharing:', error);
        }
    };

    const handleCopy = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(url);
            setShowToast(true);
        }
    };

    // Estilo compartido para mantener coherencia con Sucursales
    const iconButtonStyle = "w-11 h-11 rounded-2xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary transition-all hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20";

    return (
        <div className="flex gap-3 items-center">
            {isMobileShare ? (
                /* Botón Inteligente para Móviles con estética coherente */
                <button
                    onClick={handleShare}
                    className="flex items-center gap-3 bg-primary hover:bg-orange-600 text-white px-6 py-2.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-primary/20 active:scale-95 h-11"
                >
                    <Share2 className="w-4 h-4" />
                    Compartir Artículo
                </button>
            ) : (
                /* Versión Desktop con iconos estilo "Sucursales" */
                <>
                    <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={iconButtonStyle}
                        title="Compartir en Facebook"
                    >
                        <Facebook className="w-5 h-5" />
                    </a>
                    <a
                        href={`https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={iconButtonStyle}
                        title="Compartir por WhatsApp"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                    </a>
                </>
            )}

            <button
                onClick={handleCopy}
                className={iconButtonStyle}
                title="Copiar enlace"
            >
                <LinkIcon className="w-5 h-5" />
            </button>

            <Toast
                message="Enlace copiado al portapapeles"
                type="success"
                visible={showToast}
                onClose={() => setShowToast(false)}
            />
        </div>
    );
}
