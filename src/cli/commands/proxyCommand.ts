import { startProxy } from '../../proxy/server';

export type ProxyCommandFlags = {
  port?: string;
  host?: string;
  upstream?: string;
  noCompress?: boolean;
  quiet?: boolean;
};

export async function runProxy(flags: ProxyCommandFlags): Promise<void> {
  const port = flags.port ? Number(flags.port) : undefined;
  if (port !== undefined && (!Number.isFinite(port) || port <= 0 || port > 65535)) {
    throw new Error(`invalid --port value: ${flags.port}`);
  }

  const server = await startProxy({
    port,
    host: flags.host,
    upstream: flags.upstream,
    compressText: flags.noCompress ? false : true,
    quiet: flags.quiet === true,
  });

  process.stdout.write(`tokenzero proxy listening on ${server.url}\n`);
  process.stdout.write(`upstream: ${flags.upstream ?? 'https://api.anthropic.com'}\n`);
  process.stdout.write(
    `set ANTHROPIC_BASE_URL=${server.url} in your client to route through the proxy\n`,
  );

  const shutdown = async (signal: string): Promise<void> => {
    process.stdout.write(
      `\ntokenzero proxy: ${signal} received, total ${server.stats.requests} requests, ~${server.stats.savedTokensEstimate} tokens saved\n`,
    );
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await new Promise<void>(() => {});
}
