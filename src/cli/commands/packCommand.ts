import { packContext } from '../../core/packContext';
import type { PackOptions } from '../../types';

export type PackCommandFlags = {
  out?: string;
  maxBytes?: string;
  allowLarge?: boolean;
  text?: boolean;
  json?: boolean;
};

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export async function runPack(paths: string[], flags: PackCommandFlags): Promise<void> {
  const options: PackOptions = {
    out: flags.out,
    allowLarge: flags.allowLarge,
    compressText: flags.text !== false,
    compressJson: flags.json !== false,
  };
  if (flags.maxBytes) {
    const n = Number.parseInt(flags.maxBytes, 10);
    if (Number.isFinite(n) && n > 0) options.maxBytes = n;
  }

  const result = await packContext(paths, options);

  const lines = [
    'tokenzero pack',
    `  files included: ${result.filesIncluded}`,
    `  files ignored:  ${result.filesIgnored}`,
    `  before chars:   ${formatNumber(result.beforeChars)} (~${formatNumber(result.beforeTokensEstimate)} tokens)`,
    `  after chars:    ${formatNumber(result.afterChars)} (~${formatNumber(result.afterTokensEstimate)} tokens)`,
    `  saved:          ${formatNumber(result.savedChars)} chars (${result.savedPercent}%)`,
  ];
  if (result.outputPath) lines.push(`  output:         ${result.outputPath}`);
  process.stderr.write(lines.join('\n') + '\n');

  if (!result.outputPath) {
    process.stdout.write(result.output);
  }
}
