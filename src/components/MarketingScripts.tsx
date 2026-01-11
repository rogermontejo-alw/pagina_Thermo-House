'use client';

import { useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

function ScriptInformer({ scripts }: { scripts: any[] }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (consent === 'declined') return;

        scripts.forEach(script => {
            if (script.platform === 'facebook' && (window as any).fbq) {
                (window as any).fbq('track', 'PageView');
            }
            // Add other platforms pageview tracking here if needed
        });
    }, [pathname, searchParams, scripts]);

    return null;
}

export default function MarketingScripts({ scripts }: { scripts: any[] }) {
    const [hasConsent, setHasConsent] = useState<boolean | null>(null);

    useEffect(() => {
        // Hydrate consent from localStorage on mount
        const consent = localStorage.getItem('cookie-consent');
        setHasConsent(consent !== 'declined');

        // Optional: Listen for storage changes (if user accepts and we want to fire scripts without refresh)
        const handleStorage = () => {
            const newConsent = localStorage.getItem('cookie-consent');
            setHasConsent(newConsent !== 'declined');
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    if (!scripts || scripts.length === 0 || hasConsent === false) return null;

    return (
        <>
            <Suspense fallback={null}>
                <ScriptInformer scripts={scripts} />
            </Suspense>

            {scripts.map((script, idx) => {
                const { platform, pixel_id } = script;

                if (platform === 'facebook') {
                    return (
                        <div key={`fb-${idx}`}>
                            <Script
                                id={`fb-pixel-${idx}`}
                                strategy="afterInteractive"
                                dangerouslySetInnerHTML={{
                                    __html: `
                                        !function(f,b,e,v,n,t,s)
                                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                                        n.queue=[];t=b.createElement(e);t.async=!0;
                                        t.src=v;s=b.getElementsByTagName(e)[0];
                                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                                        'https://connect.facebook.net/en_US/fbevents.js');
                                        fbq('init', '${pixel_id}');
                                        fbq('track', 'PageView');
                                    `,
                                }}
                            />
                            <noscript>
                                <img
                                    height="1"
                                    width="1"
                                    style={{ display: 'none' }}
                                    src={`https://www.facebook.com/tr?id=${pixel_id}&ev=PageView&noscript=1`}
                                />
                            </noscript>
                        </div>
                    );
                }

                if (platform === 'google_analytics') {
                    return (
                        <div key={`ga-${idx}`}>
                            <Script
                                src={`https://www.googletagmanager.com/gtag/js?id=${pixel_id}`}
                                strategy="afterInteractive"
                            />
                            <Script
                                id={`ga-init-${idx}`}
                                strategy="afterInteractive"
                                dangerouslySetInnerHTML={{
                                    __html: `
                                        window.dataLayer = window.dataLayer || [];
                                        function gtag(){dataLayer.push(arguments);}
                                        gtag('js', new Date());
                                        gtag('config', '${pixel_id}');
                                    `,
                                }}
                            />
                        </div>
                    );
                }

                if (platform === 'google_ads') {
                    return (
                        <div key={`gads-${idx}`}>
                            <Script
                                src={`https://www.googletagmanager.com/gtag/js?id=${pixel_id}`}
                                strategy="afterInteractive"
                            />
                            <Script
                                id={`gads-init-${idx}`}
                                strategy="afterInteractive"
                                dangerouslySetInnerHTML={{
                                    __html: `
                                        window.dataLayer = window.dataLayer || [];
                                        function gtag(){dataLayer.push(arguments);}
                                        gtag('js', new Date());
                                        gtag('config', '${pixel_id}');
                                    `,
                                }}
                            />
                        </div>
                    );
                }

                if (platform === 'tiktok') {
                    return (
                        <Script
                            key={`tt-${idx}`}
                            id={`tt-pixel-${idx}`}
                            strategy="afterInteractive"
                            dangerouslySetInnerHTML={{
                                __html: `
                                    !function (w, d, t) {
                                      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=w[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                                      ttq.load('${pixel_id}');
                                      ttq.page();
                                    }(window, document, 'ttq');
                                `,
                            }}
                        />
                    );
                }

                return null;
            })}
        </>
    );
}
