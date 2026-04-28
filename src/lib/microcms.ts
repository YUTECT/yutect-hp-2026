import { createClient, type MicroCMSImage, type MicroCMSListContent } from 'microcms-js-sdk';

export type NewsCategory = 'RELEASE' | 'CASE' | 'EVENT';
export type BlogCategory = 'TECH' | 'DESIGN' | 'CASE' | 'COLUMN';
export type FeedType = 'NEWS' | 'BLOG';

type CommonFields = {
  title: string;
  publishedDate?: string;
  thumbnail?: MicroCMSImage;
  excerpt?: string;
  body?: string;
  externalUrl?: string;
};

export type News = CommonFields & {
  category?: NewsCategory[];
} & MicroCMSListContent;

export type Blog = CommonFields & {
  category?: BlogCategory[];
} & MicroCMSListContent;

export type FeedItem = (News | Blog) & {
  type: FeedType;
  href: string;
  isExternal: boolean;
};

const serviceDomain = import.meta.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = import.meta.env.MICROCMS_API_KEY;

const hasCredentials = Boolean(serviceDomain && apiKey);

const client = hasCredentials
  ? createClient({ serviceDomain: serviceDomain!, apiKey: apiKey! })
  : null;

function warnNoCredentials(label: string) {
  if (import.meta.env.DEV) {
    console.warn(`[microCMS] credentials missing — returning empty ${label} list`);
  }
}

function isNotFound(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /status:\s*404/.test(msg);
}

// ---------- News (お知らせ) ----------
export async function getNewsList(limit = 100): Promise<News[]> {
  if (!client) {
    warnNoCredentials('news');
    return [];
  }
  try {
    const res = await client.getList<News>({
      endpoint: 'news',
      queries: { limit, orders: '-publishedDate,-publishedAt' },
    });
    return res.contents;
  } catch (err) {
    if (isNotFound(err)) {
      console.warn('[microCMS] `news` endpoint not found — skipping');
      return [];
    }
    throw err;
  }
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

// ---------- Blog (ブログ) ----------
export async function getBlogList(limit = 100): Promise<Blog[]> {
  if (!client) {
    warnNoCredentials('blog');
    return [];
  }
  try {
    const res = await client.getList<Blog>({
      endpoint: 'blog',
      queries: { limit, orders: '-publishedDate,-publishedAt' },
    });
    return res.contents;
  } catch (err) {
    if (isNotFound(err)) {
      console.warn('[microCMS] `blog` endpoint not found — skipping');
      return [];
    }
    throw err;
  }
}

export async function getBlog(id: string): Promise<Blog | null> {
  if (!client) return null;
  try {
    return await client.getListDetail<Blog>({ endpoint: 'blog', contentId: id });
  } catch (err) {
    console.error(`[microCMS] failed to fetch blog/${id}`, err);
    return null;
  }
}

// ---------- Merged feed (homepage section) ----------
function effectiveDate(item: News | Blog): number {
  const iso = item.publishedDate || item.publishedAt || item.updatedAt;
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function toFeedItem(item: News | Blog, type: FeedType): FeedItem {
  const internalPath = type === 'NEWS' ? `/news/${item.id}/` : `/blog/${item.id}/`;
  const isExternal = Boolean(item.externalUrl && /^https?:\/\//.test(item.externalUrl));
  return {
    ...item,
    type,
    href: isExternal ? (item.externalUrl as string) : internalPath,
    isExternal,
  };
}

export async function getMergedFeed(limit = 4): Promise<FeedItem[]> {
  const [news, blog] = await Promise.all([getNewsList(20), getBlogList(20)]);
  const feed: FeedItem[] = [
    ...news.map((n) => toFeedItem(n, 'NEWS')),
    ...blog.map((b) => toFeedItem(b, 'BLOG')),
  ];
  feed.sort((a, b) => effectiveDate(b) - effectiveDate(a));
  return feed.slice(0, limit);
}

// ---------- Helpers ----------
export function formatNewsDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export function pickCategory<T extends string>(c?: T[]): T | undefined {
  return c && c.length > 0 ? c[0] : undefined;
}
