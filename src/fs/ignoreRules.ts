import fs from 'node:fs';
import path from 'node:path';
import ignore, { type Ignore } from 'ignore';

export const DEFAULT_IGNORE_PATTERNS = [
  'node_modules/',
  '.git/',
  'dist/',
  'build/',
  'out/',
  'coverage/',
  '.next/',
  '.nuxt/',
  '.cache/',
  '.turbo/',
  '.parcel-cache/',
  '.vite/',
  '.svelte-kit/',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  '.tokenzero/',
  '.tokenzeroignore',
  '.DS_Store',
  'Thumbs.db',
];

export type IgnoreMatcher = {
  ignores: (relativePath: string) => boolean;
};

export function loadIgnore(rootDir: string, extra: string[] = []): IgnoreMatcher {
  const ig: Ignore = ignore();
  ig.add(DEFAULT_IGNORE_PATTERNS);

  const ignoreFile = path.join(rootDir, '.tokenzeroignore');
  try {
    if (fs.existsSync(ignoreFile)) {
      const content = fs.readFileSync(ignoreFile, 'utf8');
      ig.add(content);
    }
  } catch {
    // ignore unreadable .tokenzeroignore
  }

  if (extra.length > 0) ig.add(extra);

  return {
    ignores: (relativePath: string) => {
      if (!relativePath || relativePath === '.') return false;
      const normalized = relativePath.split(path.sep).join('/');
      return ig.ignores(normalized);
    },
  };
}
