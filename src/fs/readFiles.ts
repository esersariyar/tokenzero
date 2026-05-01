import fs from 'node:fs/promises';
import path from 'node:path';

export type WalkEntry = {
  absolutePath: string;
  relativePath: string;
  size: number;
};

async function statSafe(p: string): Promise<{ isFile: boolean; isDir: boolean; size: number } | null> {
  try {
    const s = await fs.stat(p);
    return { isFile: s.isFile(), isDir: s.isDirectory(), size: s.size };
  } catch {
    return null;
  }
}

async function* walkDir(root: string, current: string): AsyncGenerator<WalkEntry> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(current, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const abs = path.join(current, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      yield* walkDir(root, abs);
    } else if (entry.isFile()) {
      const stat = await statSafe(abs);
      if (!stat || !stat.isFile) continue;
      yield {
        absolutePath: abs,
        relativePath: path.relative(root, abs).split(path.sep).join('/'),
        size: stat.size,
      };
    }
  }
}

export async function* walk(root: string, inputs: string[]): AsyncGenerator<WalkEntry> {
  const seen = new Set<string>();
  for (const input of inputs) {
    const abs = path.resolve(root, input);
    const stat = await statSafe(abs);
    if (!stat) continue;
    if (stat.isFile) {
      if (seen.has(abs)) continue;
      seen.add(abs);
      yield {
        absolutePath: abs,
        relativePath: path.relative(root, abs).split(path.sep).join('/'),
        size: stat.size,
      };
    } else if (stat.isDir) {
      for await (const entry of walkDir(root, abs)) {
        if (seen.has(entry.absolutePath)) continue;
        seen.add(entry.absolutePath);
        yield entry;
      }
    }
  }
}
