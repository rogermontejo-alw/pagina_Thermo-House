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
    default: "Thermo House | Expertos en Impermeabilización y Aislamiento Térmico",
    template: "%s | Thermo House"
  },
  description: "Servicios integrales de impermeabilización tradicional y con poliuretano espreado. Expertos en aislamiento térmico, mantenimiento de techos y eliminación de filtraciones con garantía de por vida. ¡Cotice hoy!",
  keywords: [
    "impermeabilización tradicional",
    "impermeabilización con poliuretano",
    "aislamiento térmico",
    "poliuretano espreado",
    "mantenimiento de techos Yucatán",
    "eliminación de filtraciones",
    "ahorro de energía",
    "impermeabilizantes acrílicos",
    "Thermo House Mérida",
    "protección de techos"
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
    canonical: '/',
  },
  openGraph: {
    title: "Thermo House | Impermeabilización y Mantenimiento de Techos",
    description: "Soluciones definitivas en impermeabilización tradicional y térmica. Protegemos su patrimonio con tecnología de poliuretano y mantenimiento profesional.",
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
    title: "Thermo House | Impermeabilización y Aislamiento Térmico",
    description: "Especialistas en protección de techos y eficiencia energética. Tradicional y Poliuretano.",
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
              "description": "Expertos en impermeabilización tradicional, sistemas de poliuretano espreado y mantenimiento preventivo de techos. Garantía de por vida y protección térmica de alto rendimiento.",
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
