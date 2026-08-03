import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/edge-functions';

const RELEASE_STORE = 'revit-suketto-releases';
const RELEASE_KEY = 'sketto-1.0.0-alpha.8.zip';
const EVENT_STORE = 'revit-suketto-download-events';
const RELEASE_VERSION = '1.0.0-alpha.8';
const RELEASE_SIZE = '127227193';

const notFound = () =>
  new Response('ダウンロードファイルが見つかりません。', {
    status: 404,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/plain; charset=utf-8',
      'x-robots-tag': 'noindex, nofollow, noarchive',
    },
  });

export default async function handler(request: Request, context: Context) {
  const configuredToken = Netlify.env.get('REVIT_SUKETTO_DOWNLOAD_TOKEN');
  const pathParts = new URL(request.url).pathname.split('/').filter(Boolean);
  const requestedToken = pathParts[2];
  const requestedFile = pathParts[3];

  if (!configuredToken) {
    console.error('Revit Suketto download token is not configured');
    return notFound();
  }

  if (requestedToken !== configuredToken) {
    console.warn('Rejected Revit Suketto download with an invalid token');
    return notFound();
  }

  if (requestedFile !== RELEASE_KEY) {
    console.warn('Rejected Revit Suketto download with an invalid file name');
    return notFound();
  }

  const releases = getStore(RELEASE_STORE);
  const release = await releases.getWithMetadata(RELEASE_KEY, { type: 'stream' });

  if (release === null) {
    console.error('Revit Suketto release blob was not found');
    return notFound();
  }

  const occurredAt = new Date().toISOString();
  const eventKey = `${occurredAt.slice(0, 10)}/${crypto.randomUUID()}`;
  const events = getStore(EVENT_STORE);
  const recordEvent = events.setJSON(eventKey, {
    occurredAt,
    version: RELEASE_VERSION,
    fileName: RELEASE_KEY,
    requestId: context.requestId,
  }).catch((error) => {
    console.error('Failed to record Revit Suketto download event', error);
  });

  context.waitUntil(recordEvent);

  const headers = new Headers({
    'cache-control': 'private, no-store',
    'content-disposition': `attachment; filename="${RELEASE_KEY}"`,
    'content-length': RELEASE_SIZE,
    'content-type': 'application/zip',
    'x-content-type-options': 'nosniff',
    'x-robots-tag': 'noindex, nofollow, noarchive',
  });

  if (release.etag) {
    headers.set('etag', release.etag);
  }

  return new Response(release.data, { headers });
}

export const config: Config = {
  path: '/downloads/revit-suketto/*',
  method: 'GET',
  rateLimit: {
    windowLimit: 5,
    windowSize: 180,
    aggregateBy: ['ip', 'domain'],
  },
};
