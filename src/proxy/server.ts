import http from 'node:http';
import { URL } from 'node:url';
import type { ProxyOptions, ProxyStats } from '../types';
import { compressAnthropicBody } from './compressMessages';
import { estimateTokens } from '../core/estimateTokens';

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_UPSTREAM = 'https://api.anthropic.com';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

export type ProxyServer = {
  url: string;
  port: number;
  stats: ProxyStats;
  close: () => Promise<void>;
};

function readBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function filterHeaders(headers: http.IncomingHttpHeaders): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
    out[key] = Array.isArray(value) ? value.join(', ') : value;
  }
  return out;
}

function isCompressibleMessages(pathname: string, method: string): boolean {
  return method === 'POST' && /\/v1\/messages\/?$/.test(pathname);
}

function logRequest(
  pathname: string,
  before: number,
  after: number,
  stats: ProxyStats,
  quiet: boolean,
): void {
  if (quiet) return;
  if (before === 0) {
    process.stdout.write(`tokenzero proxy: ${pathname} (no compressible text)\n`);
    return;
  }
  const saved = before - after;
  const percent = Math.round((saved / before) * 10000) / 100;
  const tokens = Math.max(0, estimateTokens('x'.repeat(saved)));
  process.stdout.write(
    `tokenzero proxy: ${pathname} ${before} -> ${after} chars (${percent}% saved, ~${tokens} tokens) total saved ~${stats.savedTokensEstimate} tokens\n`,
  );
}

export async function startProxy(options: ProxyOptions = {}): Promise<ProxyServer> {
  const port = options.port ?? DEFAULT_PORT;
  const host = options.host ?? DEFAULT_HOST;
  const upstream = new URL(options.upstream ?? DEFAULT_UPSTREAM);
  const compressEnabled = options.compressText !== false;
  const quiet = options.quiet === true;

  const stats: ProxyStats = {
    requests: 0,
    beforeChars: 0,
    afterChars: 0,
    savedChars: 0,
    savedTokensEstimate: 0,
  };

  const server = http.createServer(async (req, res) => {
    try {
      const pathname = req.url ?? '/';
      const method = req.method ?? 'GET';
      const rawBody = await readBody(req);

      let outgoingBody: Buffer = rawBody;
      let beforeChars = 0;
      let afterChars = 0;

      if (compressEnabled && isCompressibleMessages(pathname, method) && rawBody.length > 0) {
        try {
          const parsed = JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
          const result = compressAnthropicBody(parsed);
          beforeChars = result.beforeChars;
          afterChars = result.afterChars;
          outgoingBody = Buffer.from(JSON.stringify(result.body), 'utf8');
        } catch {
          outgoingBody = rawBody;
        }
      }

      stats.requests += 1;
      stats.beforeChars += beforeChars;
      stats.afterChars += afterChars;
      stats.savedChars += Math.max(0, beforeChars - afterChars);
      stats.savedTokensEstimate = Math.round(stats.savedChars / 4);

      const targetUrl = new URL(pathname, upstream);
      const upstreamRes = await fetch(targetUrl, {
        method,
        headers: { ...filterHeaders(req.headers), 'content-length': String(outgoingBody.length) },
        body: method === 'GET' || method === 'HEAD' ? undefined : outgoingBody,
        redirect: 'manual',
      });

      const responseHeaders: Record<string, string> = {};
      upstreamRes.headers.forEach((value, key) => {
        if (HOP_BY_HOP.has(key.toLowerCase())) return;
        responseHeaders[key] = value;
      });

      res.writeHead(upstreamRes.status, responseHeaders);

      if (upstreamRes.body) {
        const reader = upstreamRes.body.getReader();
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) res.write(Buffer.from(value));
        }
      }
      res.end();

      logRequest(pathname, beforeChars, afterChars, stats, quiet);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!res.headersSent) {
        res.writeHead(502, { 'content-type': 'application/json' });
      }
      res.end(JSON.stringify({ error: { type: 'tokenzero_proxy_error', message } }));
    }
  });

  await new Promise<void>((resolve) => server.listen(port, host, resolve));
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;

  return {
    url: `http://${host}:${actualPort}`,
    port: actualPort,
    stats,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
