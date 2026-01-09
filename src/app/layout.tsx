import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://thermohouse.mx'),
  title: {
    default: "Thermohouse México | Impermeabilización y Aislamiento Térmico",
    template: "%s | Thermohouse México"
  },
  description: "Líderes en impermeabilización y aislamiento térmico en todo México. Expertos en sistemas de poliuretano de alta densidad para el clima de Mérida y la Península de Yucatán. ¡Cotiza hoy desde $79/m²!",
  keywords: [
    "impermeabilización México",
    "impermeabilizante Mérida",
    "impermeabilización Yucatán",
    "aislamiento térmico Mérida",
    "poliuretano espreado",
    "Thermo House México",
    "ahorro de energía",
    "mejor impermeabilizante para calor",
    "impermeabilización Cancún",
    "protección de techos Sureste"
  ],
  authors: [{ name: "Thermo House" }],
  creator: "Thermo House",
  publisher: "Thermo House",
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: 'https://thermohouse.mx',
  },
  openGraph: {
    title: "Thermohouse México | Impermeabilización y Aislamiento Térmico",
    description: "Protege tu hogar del calor y la lluvia con Thermohouse. Expertos en sistemas de impermeabilización con poliuretano en México. ¡Cotiza hoy mismo desde $79/m²!",
    url: 'https://thermohouse.mx',
    siteName: 'Thermo House',
    locale: 'es_MX',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sistemas de Impermeabilización Thermo House',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Thermohouse México | Impermeabilización y Aislamiento Térmico",
    description: "Protege tu hogar del calor y la lluvia con Thermohouse. Expertos en sistemas de impermeabilización con poliuretano en México. ¡Cotiza hoy mismo desde $79/m²!",
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo-square.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo-square.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Preconnect to Supabase for faster media loading */}
        <link rel="preconnect" href="https://ewysxryaqwdscqecyomi.supabase.co" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              "name": "Thermo House",
              "image": "https://thermohouse.mx/logo.png",
              "@id": "https://thermohouse.mx",
              "url": "https://thermohouse.mx",
              "telephone": "+529992006267",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Mérida, Yucatán",
                "addressLocality": "Mérida",
                "addressRegion": "Yucatán",
                "postalCode": "97000",
                "addressCountry": "MX"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 20.96737,
                "longitude": -89.592586
              },
              "servesCrawl": true,
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday"
                ],
                "opens": "09:00",
                "closes": "18:00"
              },
              "sameAs": [
                "https://www.facebook.com/thermohousemx",
                "https://www.instagram.com/thermohousemx"
              ],
              "description": "Protege tu hogar del calor y la lluvia con Thermohouse. Expertos en sistemas de impermeabilización con poliuretano en México. ¡Cotiza hoy mismo desde $79/m²!",
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Servicios de Protección de Techos",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Impermeabilización con Poliuretano Espreado",
                      "description": "Máximo aislamiento térmico y sellado hermético total."
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Impermeabilización Tradicional y Acrílica",
                      "description": "Sistemas de mantenimiento preventivo y sellado de grietas."
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Mantenimiento y Reparación de Techos",
                      "description": "Limpieza, resanado y protección continua para su hogar."
                    }
                  }
                ]
              }
            })
          }}
        />
        {/* Additional Schema for Sitelinks */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Thermo House",
              "url": "https://thermohouse.mx",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://thermohouse.mx/blog?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "hasPart": [
                {
                  "@type": "WebPage",
                  "name": "Cotizador Digital en Linea",
                  "url": "https://thermohouse.mx/cotizador",
                  "description": "Cotiza la impermeabilización de tu casa en menos de 2 minutos."
                },
                {
                  "@type": "WebPage",
                  "name": "Sistemas TH FIX, LIGHT y FORTE",
                  "url": "https://thermohouse.mx/sistemas",
                  "description": "Aislamiento térmico y sellado de cubetas con poliuretano de alta densidad."
                },
                {
                  "@type": "WebPage",
                  "name": "Garantía de por Vida",
                  "url": "https://thermohouse.mx/garantia",
                  "description": "Información sobre nuestra exclusiva garantía de protección permanente."
                },
                {
                  "@type": "WebPage",
                  "name": "Blog y Consejos Técnicos",
                  "url": "https://thermohouse.mx/blog",
                  "description": "Aprende a proteger tu techo y ahorrar energía."
                },
                {
                  "@type": "WebPage",
                  "name": "Contacto y Sucursales",
                  "url": "https://thermohouse.mx/sucursales",
                  "description": "Nuestras oficinas en Mérida, Playa del Carmen y soporte en el sureste."
                }
              ]
            })
          }}
        />
        <link rel="preconnect" href="https://ewysxryaqwdscqecyomi.supabase.co" />
        <link rel="dns-prefetch" href="https://ewysxryaqwdscqecyomi.supabase.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground transition-colors duration-300`}
      >
        {children}
      </body>
    </html>
  );
}
