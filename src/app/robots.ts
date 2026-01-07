import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/th-manager/', // Exclude admin area from search engines
        },
        sitemap: 'https://thermohouse.mx/sitemap.xml',
    }
}
