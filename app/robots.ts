import { MetadataRoute } from 'next';
import { clientEnv } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = clientEnv.NEXT_PUBLIC_SITE_URL || 'https://crafthacks.dev';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/2d'],
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

