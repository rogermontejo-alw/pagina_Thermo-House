import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/admin/', // Exclude admin area from search engines
        },
        sitemap: 'https://thermohouse.mx/sitemap.xml',
    }
}
