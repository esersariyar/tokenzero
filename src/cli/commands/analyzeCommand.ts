import { analyzeContext } from '../../core/analyzeContext';

export type AnalyzeCommandFlags = {
  json?: boolean;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function runAnalyze(paths: string[], flags: AnalyzeCommandFlags): Promise<void> {
  const result = await analyzeContext(paths);

  if (flags.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }

  const lines: string[] = [];
  lines.push('tokenzero analyze');
  lines.push(`  total files scanned: ${result.totalScanned}`);
  lines.push(`  files included:      ${result.included}`);
  lines.push(`  files ignored:       ${result.ignored}`);
  lines.push(`  estimated savings:   ${result.estimatedSavedChars} chars (${result.estimatedSavedPercent}%)`);

  if (result.biggest.length > 0) {
    lines.push('');
    lines.push('biggest files:');
    for (const f of result.biggest) {
      lines.push(`  ${formatBytes(f.bytes).padStart(8)}  ${f.path}`);
    }
  }

  if (result.jsonTableCandidates.length > 0) {
    lines.push('');
    lines.push('JSON files that look table-compressible:');
    for (const p of result.jsonTableCandidates) lines.push(`  - ${p}`);
  }

  if (result.recommendedExcludes.length > 0) {
    lines.push('');
    lines.push('recommended excludes:');
    for (const p of result.recommendedExcludes) lines.push(`  - ${p}`);
  }

  process.stdout.write(lines.join('\n') + '\n');
}
