import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', '/pricing', '/privacy', '/terms', '/cookies', '/contact'];
  return paths.map((path) => ({
    url: `https://shoes.fasheone.com${path}`,
    lastModified: new Date('2026-08-18'),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.6,
  }));
}
