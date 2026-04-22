import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

function resolveMediaPath(rawPath: string) {
  if (rawPath.startsWith('~/')) {
    return path.join(os.homedir(), rawPath.slice(2));
  }

  return rawPath;
}

const ALLOWED_ROOTS = [
  path.join(os.homedir(), 'Desktop', 'MS Forklift Inventory'),
  path.join(
    os.homedir(),
    'Desktop',
    'Vortex Ventures',
    'VVAxeOps',
    'Projects',
    'materialsolutionsnj',
    'data',
    'listing_packets',
    'assets'
  ),
];

function isAllowedMediaPath(filePath: string) {
  const resolved = path.resolve(filePath);
  return ALLOWED_ROOTS.some((root) => resolved.startsWith(root));
}

function getContentType(filePath: string) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPath = searchParams.get('path');

  if (!rawPath) {
    return new Response('Missing media path', { status: 400 });
  }

  const filePath = resolveMediaPath(rawPath);
  if (!isAllowedMediaPath(filePath)) {
    return new Response('Forbidden', { status: 403 });
  }

  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const contentType = getContentType(filePath);
  const headers = new Headers({
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600',
  });

  const range = request.headers.get('range');
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match) {
      const start = match[1] ? Number.parseInt(match[1], 10) : 0;
      const end = match[2] ? Number.parseInt(match[2], 10) : fileStat.size - 1;

      if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= fileStat.size) {
        return new Response('Requested range not satisfiable', {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileStat.size}`,
          },
        });
      }

      headers.set('Content-Range', `bytes ${start}-${end}/${fileStat.size}`);
      headers.set('Content-Length', String(end - start + 1));

      const stream = createReadStream(filePath, { start, end });
      return new Response(stream as unknown as ReadableStream, {
        status: 206,
        headers,
      });
    }
  }

  headers.set('Content-Length', String(fileStat.size));
  const stream = createReadStream(filePath);
  return new Response(stream as unknown as ReadableStream, {
    status: 200,
    headers,
  });
}
