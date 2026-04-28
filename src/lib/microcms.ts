import { createClient, type MicroCMSImage, type MicroCMSListContent } from 'microcms-js-sdk';

export type NewsCategory = 'RELEASE' | 'CASE' | 'COLUMN' | 'EVENT';

export type News = {
  title: string;
  publishedDate?: string;
  category?: NewsCategory[];
  thumbnail?: MicroCMSImage;
  excerpt?: string;
  body?: string;
  slug?: string;
} & MicroCMSListContent;

const serviceDomain = import.meta.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = import.meta.env.MICROCMS_API_KEY;

const hasCredentials = Boolean(serviceDomain && apiKey);

const client = hasCredentials
  ? createClient({ serviceDomain: serviceDomain!, apiKey: apiKey! })
  : null;

export async function getNewsList(limit = 100): Promise<News[]> {
  if (!client) {
    if (import.meta.env.DEV) {
      console.warn('[microCMS] credentials missing — returning empty news list');
    }
    return [];
  }
  const res = await client.getList<News>({
    endpoint: 'news',
    queries: { limit, orders: '-publishedDate,-publishedAt' },
  });
  return res.contents;
}

export async function getNews(id: string): Promise<News | null> {
  if (!client) return null;
  try {
    return await client.getListDetail<News>({ endpoint: 'news', contentId: id });
  } catch (err) {
    console.error(`[microCMS] failed to fetch news/${id}`, err);
    return null;
  }
}

export function formatNewsDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export function pickCategory(c?: NewsCategory[]): NewsCategory | undefined {
  return c && c.length > 0 ? c[0] : undefined;
}
