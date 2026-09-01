import { createHash, randomUUID } from 'node:crypto';

const entityMap = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' '
};

function decodeEntities(value) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, token) => {
    if (token[0] === '#') {
      const radix = token[1]?.toLowerCase() === 'x' ? 16 : 10;
      const number = Number.parseInt(token.replace(/^#x?/i, ''), radix);
      return Number.isFinite(number) ? String.fromCodePoint(number) : match;
    }
    return entityMap[token.toLowerCase()] ?? match;
  });
}
function stripTags(value) {
  return decodeEntities(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--([\s\S]*?)-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
}

function titleFromHtml(html, fallback) {
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? stripTags(title).slice(0, 180) : fallback;
}

function headingsFromHtml(html) {
  return [...html.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map((match) => stripTags(match[2]))
    .filter((heading) => heading.length > 2 && heading.length < 180)
    .slice(0, 80);
}

function fingerprint(html) {
  const normalized = stripTags(html).replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, '');
  return createHash('sha256').update(normalized).digest('hex');
}

export function normalizeSourceUrl(input) {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('只支持 http 或 https 来源');
  url.hash = '';
  return url.toString();
}

export async function inspectSource(source, previous = null) {
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(source.url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
      headers: {
        'user-agent': 'MarketStructureAtlas/1.0 (local learning source monitor)',
        accept: 'text/html,application/xhtml+xml'
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const hash = fingerprint(html);
    const headings = headingsFromHtml(html);
    const snapshot = {
      sourceId: source.id,
      title: titleFromHtml(html, source.title),
      finalUrl: response.url,
      hash,
      headings,
      bytes: Buffer.byteLength(html),
      etag: response.headers.get('etag'),
      lastModified: response.headers.get('last-modified'),
      checkedAt,
      status: 'ok'
    };

    const changed = Boolean(previous?.hash && previous.hash !== hash);
    const candidate = changed ? buildCandidate(source, previous, snapshot) : null;
    return { snapshot, changed, candidate };
  } catch (error) {
    return {
      snapshot: {
        sourceId: source.id,
        checkedAt,
        status: 'error',
        error: error.message
      },
      changed: false,
      candidate: null
    };
  }
}

function buildCandidate(source, previous, current) {
  const oldHeadings = new Set(previous.headings ?? []);
  const newHeadings = new Set(current.headings ?? []);
  const added = current.headings.filter((heading) => !oldHeadings.has(heading));
  const removed = (previous.headings ?? []).filter((heading) => !newHeadings.has(heading));
  return {
    id: randomUUID(),
    sourceId: source.id,
    sourceTitle: source.title,
    url: source.url,
    detectedAt: current.checkedAt,
    status: 'pending',
    summary: added.length || removed.length
      ? `检测到目录变化：新增 ${added.length} 项，移除 ${removed.length} 项。`
      : '页面正文指纹发生变化，标题目录未变。',
    addedHeadings: added.slice(0, 12),
    removedHeadings: removed.slice(0, 12),
    reviewNote: ''
  };
}
