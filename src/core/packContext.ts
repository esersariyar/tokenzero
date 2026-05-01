import fs from 'node:fs/promises';
import path from 'node:path';
import type { PackOptions, PackResult, PackReportEntry } from '../types';
import { walk } from '../fs/readFiles';
import { loadIgnore } from '../fs/ignoreRules';
import { isBinaryByExtension, looksBinary, isLikelyTextByExtension } from '../fs/fileType';
import { writeFileSafe } from '../fs/writeFileSafe';
import { compressText } from './compressText';
import { compressJson } from './compressJson';
import { estimateTokens } from './estimateTokens';
import { DEFAULT_MAX_BYTES } from '../config/defaultConfig';

const HEADER_PREFIX = '--- file: ';
const HEADER_SUFFIX = ' ---';

async function readFileSafely(absolutePath: string): Promise<{ buffer: Buffer; text: string } | null> {
  try {
    const buffer = await fs.readFile(absolutePath);
    if (looksBinary(buffer)) return null;
    return { buffer, text: buffer.toString('utf8') };
  } catch {
    return null;
  }
}

export async function packContext(paths: string[], options: PackOptions = {}): Promise<PackResult> {
  const cwd = options.cwd ?? process.cwd();
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const allowLarge = options.allowLarge ?? false;
  const doText = options.compressText ?? true;
  const doJson = options.compressJson ?? true;

  const matcher = loadIgnore(cwd, options.extraIgnore ?? []);
  const inputs = paths.length > 0 ? paths : ['.'];

  const chunks: string[] = [];
  const report: PackReportEntry[] = [];
  let beforeChars = 0;
  let afterChars = 0;
  let included = 0;
  let ignored = 0;

  for await (const entry of walk(cwd, inputs)) {
    if (matcher.ignores(entry.relativePath)) {
      ignored++;
      continue;
    }
    if (isBinaryByExtension(entry.absolutePath)) {
      ignored++;
      continue;
    }
    if (!isLikelyTextByExtension(entry.absolutePath)) {
      ignored++;
      continue;
    }
    if (!allowLarge && entry.size > maxBytes) {
      ignored++;
      continue;
    }

    const read = await readFileSafely(entry.absolutePath);
    if (!read) {
      ignored++;
      continue;
    }

    const original = read.text;
    let processed = original;
    const ext = path.extname(entry.absolutePath).toLowerCase();

    if (ext === '.json' && doJson) {
      processed = compressJson(original).output;
    } else if (doText) {
      processed = compressText(original).output;
    }

    const header = `${HEADER_PREFIX}${entry.relativePath}${HEADER_SUFFIX}\n`;
    const block = header + processed + (processed.endsWith('\n') ? '' : '\n');
    chunks.push(block);

    beforeChars += original.length;
    afterChars += block.length;
    included++;
    report.push({
      path: entry.relativePath,
      beforeChars: original.length,
      afterChars: block.length,
    });
  }

  const output = chunks.join('\n');
  if (options.out) {
    await writeFileSafe(path.resolve(cwd, options.out), output);
  }

  const savedChars = Math.max(0, beforeChars - afterChars);
  const savedPercent = beforeChars === 0 ? 0 : Math.round((savedChars / beforeChars) * 10000) / 100;

  return {
    output,
    outputPath: options.out ? path.resolve(cwd, options.out) : undefined,
    filesIncluded: included,
    filesIgnored: ignored,
    beforeChars,
    afterChars,
    beforeTokensEstimate: Math.ceil(beforeChars / 4),
    afterTokensEstimate: estimateTokens(output),
    savedChars,
    savedPercent,
    report,
  };
}
