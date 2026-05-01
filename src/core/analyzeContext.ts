import fs from 'node:fs/promises';
import path from 'node:path';
import type { AnalyzeOptions, AnalyzeResult, BiggestFile } from '../types';
import { walk } from '../fs/readFiles';
import { loadIgnore } from '../fs/ignoreRules';
import { isBinaryByExtension, isLikelyTextByExtension, looksBinary } from '../fs/fileType';
import { compressJson } from './compressJson';
import { compressText } from './compressText';
import { DEFAULT_MAX_BYTES } from '../config/defaultConfig';

const LARGE_FILE_BYTES = 100 * 1024;
const TABLE_CANDIDATE_THRESHOLD = 20;

export async function analyzeContext(paths: string[], options: AnalyzeOptions = {}): Promise<AnalyzeResult> {
  const cwd = options.cwd ?? process.cwd();
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const matcher = loadIgnore(cwd, options.extraIgnore ?? []);
  const inputs = paths.length > 0 ? paths : ['.'];

  let totalScanned = 0;
  let included = 0;
  let ignored = 0;
  let totalBefore = 0;
  let totalAfter = 0;
  const biggest: BiggestFile[] = [];
  const jsonTableCandidates: string[] = [];
  const dirBytes = new Map<string, number>();
  const recommendedExcludes: string[] = [];

  for await (const entry of walk(cwd, inputs)) {
    totalScanned++;

    if (matcher.ignores(entry.relativePath) || isBinaryByExtension(entry.absolutePath) || !isLikelyTextByExtension(entry.absolutePath)) {
      ignored++;
      continue;
    }
    if (entry.size > maxBytes) {
      ignored++;
      recommendedExcludes.push(entry.relativePath);
      continue;
    }

    let buffer: Buffer;
    try {
      buffer = await fs.readFile(entry.absolutePath);
    } catch {
      ignored++;
      continue;
    }
    if (looksBinary(buffer)) {
      ignored++;
      continue;
    }

    const original = buffer.toString('utf8');
    const ext = path.extname(entry.absolutePath).toLowerCase();
    const compressed = ext === '.json' ? compressJson(original) : compressText(original);

    if (ext === '.json' && compressed.savedPercent >= TABLE_CANDIDATE_THRESHOLD) {
      jsonTableCandidates.push(entry.relativePath);
    }

    totalBefore += compressed.beforeChars;
    totalAfter += compressed.afterChars;
    included++;

    biggest.push({ path: entry.relativePath, bytes: entry.size });
    if (entry.size >= LARGE_FILE_BYTES) recommendedExcludes.push(entry.relativePath);

    const slashIndex = entry.relativePath.indexOf('/');
    if (slashIndex > 0) {
      const topDir = entry.relativePath.slice(0, slashIndex);
      dirBytes.set(topDir, (dirBytes.get(topDir) ?? 0) + entry.size);
    }
  }

  biggest.sort((a, b) => b.bytes - a.bytes);
  const top = biggest.slice(0, 10);

  const totalDirBytes = Array.from(dirBytes.values()).reduce((a, b) => a + b, 0);
  if (totalDirBytes >= 100 * 1024) {
    for (const [dir, bytes] of dirBytes) {
      if (bytes / totalDirBytes > 0.25 && !recommendedExcludes.includes(`${dir}/`)) {
        recommendedExcludes.push(`${dir}/`);
      }
    }
  }

  const savedChars = Math.max(0, totalBefore - totalAfter);
  const savedPercent = totalBefore === 0 ? 0 : Math.round((savedChars / totalBefore) * 10000) / 100;

  return {
    totalScanned,
    included,
    ignored,
    biggest: top,
    estimatedSavedChars: savedChars,
    estimatedSavedPercent: savedPercent,
    jsonTableCandidates,
    recommendedExcludes: Array.from(new Set(recommendedExcludes)),
  };
}
