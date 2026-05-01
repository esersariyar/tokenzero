import type { CompressResult, JsonCompressOptions } from '../types';
import { estimateTokens } from './estimateTokens';

function buildResult(input: string, output: string): CompressResult {
  const beforeChars = input.length;
  const afterChars = output.length;
  const savedChars = Math.max(0, beforeChars - afterChars);
  const savedPercent = beforeChars === 0 ? 0 : (savedChars / beforeChars) * 100;
  return {
    output,
    beforeChars,
    afterChars,
    beforeTokensEstimate: estimateTokens(input),
    afterTokensEstimate: estimateTokens(output),
    savedChars,
    savedPercent: Math.round(savedPercent * 100) / 100,
  };
}

function isPrimitive(v: unknown): boolean {
  return v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
}

function isUniformPrimitiveArray(value: unknown): value is Record<string, string | number | boolean | null>[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  const first = value[0];
  if (!first || typeof first !== 'object' || Array.isArray(first)) return false;
  const keys = Object.keys(first);
  if (keys.length === 0) return false;
  for (const row of value) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
    const rowKeys = Object.keys(row);
    if (rowKeys.length !== keys.length) return false;
    for (const k of keys) {
      if (!(k in row)) return false;
      if (!isPrimitive((row as Record<string, unknown>)[k])) return false;
    }
  }
  return true;
}

function formatCell(value: string | number | boolean | null, allowPipeEscape: boolean): string | null {
  if (value === null) return '';
  const s = String(value).replace(/\r\n?|\n/g, ' ');
  if (s.includes('|')) {
    if (!allowPipeEscape) return null;
    return s.replace(/\|/g, '\\|');
  }
  return s;
}

export function compressJson(input: string, options: JsonCompressOptions = {}): CompressResult {
  if (!input) return buildResult('', '');

  const allowPipeEscape = options.allowPipeEscape ?? true;

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return buildResult(input, input);
  }

  if (isUniformPrimitiveArray(parsed)) {
    const keys = Object.keys(parsed[0]!);
    const rows: string[] = [`cols: ${keys.join(' | ')}`];
    let pipeAbort = false;
    for (const row of parsed) {
      const cells: string[] = [];
      for (const k of keys) {
        const cell = formatCell(row[k] ?? null, allowPipeEscape);
        if (cell === null) {
          pipeAbort = true;
          break;
        }
        cells.push(cell);
      }
      if (pipeAbort) break;
      rows.push(cells.join(' | '));
    }
    if (!pipeAbort) {
      return buildResult(input, rows.join('\n'));
    }
  }

  return buildResult(input, JSON.stringify(parsed));
}
