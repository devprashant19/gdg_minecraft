import { MetadataRoute } from 'next';
import { clientEnv } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = clientEnv.NEXT_PUBLIC_SITE_URL || 'https://crafthacks.dev';
  const now = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/2d`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];
}

