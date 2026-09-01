import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectSource, normalizeSourceUrl } from './lib/source-checker.js';
import { readJson, safeId, writeJson } from './lib/storage.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, 'public');
const dataDir = path.join(root, 'data');
const runtimeDir = path.join(dataDir, 'runtime');
const paths = {
  content: path.join(dataDir, 'content.json'),
  beginner: path.join(dataDir, 'beginner.json'),
  glossaryDetails: path.join(dataDir, 'glossary-details.json'),
  lessonDepth: path.join(dataDir, 'lesson-depth.json'),
  textbookChapters: path.join(dataDir, 'textbook-chapters.json'),
  cases: path.join(dataDir, 'cases.json'),
  sources: path.join(dataDir, 'sources.json'),
  progress: path.join(runtimeDir, 'progress.json'),
  updates: path.join(runtimeDir, 'updates.json')
};

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const updateHours = Math.max(1, Number(process.env.UPDATE_INTERVAL_HOURS || 24));
let updateRun = null;

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.ico', 'image/x-icon']
]);

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64_000) throw new HttpError(413, '请求内容过大');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, '请求必须是有效 JSON');
  }
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(JSON.stringify(value));
}

async function bootstrap() {
  const [content, beginner, glossaryDetails, lessonDepth, textbookChapters, casebook, sources, progress, updates] = await Promise.all([
    readJson(paths.content, {}),
    readJson(paths.beginner, { meta: {}, guides: {} }),
    readJson(paths.glossaryDetails, { meta: {}, details: {} }),
    readJson(paths.lessonDepth, { meta: {}, lessons: {} }),
    readJson(paths.textbookChapters, { meta: {}, chapters: {} }),
    readJson(paths.cases, { meta: {}, cases: [] }),
    readJson(paths.sources, []),
    readJson(paths.progress, { completedLessons: [], quizResults: {}, updatedAt: null }),
    readJson(paths.updates, { snapshots: {}, candidates: [], lastRunAt: null, lastRunReason: null })
  ]);
  return {
    content,
    beginner,
    glossaryDetails,
    lessonDepth,
    textbookChapters,
    casebook,
    sources,
    progress,
    updates: {
      candidates: updates.candidates,
      snapshots: updates.snapshots,
      lastRunAt: updates.lastRunAt,
      lastRunReason: updates.lastRunReason,
      running: Boolean(updateRun),
      intervalHours: updateHours
    }
  };
}

async function runSourceUpdate(reason = 'manual') {
  if (updateRun) return updateRun;
  updateRun = (async () => {
    const [sources, updates] = await Promise.all([
      readJson(paths.sources, []),
      readJson(paths.updates, { snapshots: {}, candidates: [], lastRunAt: null, lastRunReason: null })
    ]);
    const results = [];
    for (const source of sources) {
      const result = await inspectSource(source, updates.snapshots[source.id]);
      updates.snapshots[source.id] = result.snapshot;
      if (result.candidate) updates.candidates.unshift(result.candidate);
      results.push({ sourceId: source.id, status: result.snapshot.status, changed: result.changed });
    }
    updates.candidates = updates.candidates.slice(0, 100);
    updates.lastRunAt = new Date().toISOString();
    updates.lastRunReason = reason;
    await writeJson(paths.updates, updates);
    return { results, lastRunAt: updates.lastRunAt };
  })().finally(() => {
    updateRun = null;
  });
  return updateRun;
}

async function handleApi(request, response, url) {
  if (request.method === 'GET' && url.pathname === '/api/bootstrap') {
    return sendJson(response, 200, await bootstrap());
  }

  if (request.method === 'POST' && url.pathname === '/api/progress') {
    const body = await readBody(request);
    const progress = await readJson(paths.progress, { completedLessons: [], quizResults: {}, updatedAt: null });
    if (body.lessonId) {
      const completed = new Set(progress.completedLessons);
      body.completed ? completed.add(String(body.lessonId)) : completed.delete(String(body.lessonId));
      progress.completedLessons = [...completed];
    }
    if (body.quizId) {
      progress.quizResults[String(body.quizId)] = {
        correct: Boolean(body.correct),
        answeredAt: new Date().toISOString()
      };
    }
    progress.updatedAt = new Date().toISOString();
    await writeJson(paths.progress, progress);
    return sendJson(response, 200, { progress });
  }

  if (request.method === 'POST' && url.pathname === '/api/updates/run') {
    const result = await runSourceUpdate('manual');
    return sendJson(response, 200, result);
  }

  const reviewMatch = url.pathname.match(/^\/api\/updates\/([^/]+)\/review$/);
  if (request.method === 'POST' && reviewMatch) {
    const body = await readBody(request);
    if (!['accepted', 'dismissed', 'pending'].includes(body.status)) {
      throw new HttpError(400, '无效审核状态');
    }
    const updates = await readJson(paths.updates, { snapshots: {}, candidates: [] });
    const candidate = updates.candidates.find((item) => item.id === decodeURIComponent(reviewMatch[1]));
    if (!candidate) throw new HttpError(404, '未找到更新候选');
    candidate.status = body.status;
    candidate.reviewNote = String(body.reviewNote ?? '').slice(0, 1000);
    candidate.reviewedAt = new Date().toISOString();
    await writeJson(paths.updates, updates);
    return sendJson(response, 200, { candidate });
  }

  if (request.method === 'POST' && url.pathname === '/api/sources') {
    const body = await readBody(request);
    const normalizedUrl = normalizeSourceUrl(body.url);
    const sources = await readJson(paths.sources, []);
    if (sources.some((source) => source.url === normalizedUrl)) throw new HttpError(409, '来源已存在');
    const title = String(body.title ?? new URL(normalizedUrl).hostname).trim().slice(0, 120);
    const baseId = safeId(title) || `source-${Date.now()}`;
    let id = baseId;
    let suffix = 2;
    while (sources.some((source) => source.id === id)) id = `${baseId}-${suffix++}`;
    const source = { id, title, url: normalizedUrl, category: 'extended', addedAt: new Date().toISOString() };
    sources.push(source);
    await writeJson(paths.sources, sources);
    return sendJson(response, 201, { source });
  }

  throw new HttpError(404, 'API 路径不存在');
}

async function serveStatic(response, url) {
  const relativePath = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
  const filePath = path.resolve(publicDir, relativePath);
  if (!filePath.startsWith(`${publicDir}${path.sep}`) && filePath !== path.join(publicDir, 'index.html')) {
    throw new HttpError(403, '禁止访问');
  }
  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      'content-type': mime.get(path.extname(filePath)) || 'application/octet-stream',
      'cache-control': 'no-cache'
    });
    response.end(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      const index = await readFile(path.join(publicDir, 'index.html'));
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return response.end(index);
    }
    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || `${host}:${port}`}`);
    if (url.pathname.startsWith('/api/')) await handleApi(request, response, url);
    else await serveStatic(response, url);
  } catch (error) {
    const status = error.status || 500;
    sendJson(response, status, { error: status === 500 ? '服务器内部错误' : error.message });
    if (status === 500) console.error(error);
  }
});

server.listen(port, host, () => {
  console.log(`Market Structure Atlas → http://${host}:${port}`);
  console.log(`Source checks every ${updateHours}h; set UPDATE_INTERVAL_HOURS to change.`);
});

const timer = setInterval(() => {
  runSourceUpdate('scheduled').catch((error) => console.error('Scheduled source check failed:', error));
}, updateHours * 60 * 60 * 1000);
timer.unref();

process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
