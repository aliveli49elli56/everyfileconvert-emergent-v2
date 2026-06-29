import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/_next/', '/api/'],
      },
    ],
    sitemap: [
      'https://everyfileconvert.com/sitemap/0.xml',
      'https://everyfileconvert.com/image-sitemap.xml',
    ],
    host: 'https://everyfileconvert.com',
  };
}
