import fs from 'node:fs';
import path from 'node:path';
import type { TokenZeroConfig } from '../types';
import { defaultConfig } from './defaultConfig';

export const CONFIG_PATH = path.join('.tokenzero', 'config.json');

export function loadConfig(cwd: string = process.cwd()): TokenZeroConfig {
  const file = path.join(cwd, CONFIG_PATH);
  if (!fs.existsSync(file)) return { ...defaultConfig };

  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw) as Partial<TokenZeroConfig>;
    return {
      ...defaultConfig,
      ...parsed,
      ignore: Array.isArray(parsed.ignore) ? parsed.ignore : defaultConfig.ignore,
    };
  } catch (err) {
    process.stderr.write(`tokenzero: warning — failed to read ${CONFIG_PATH} (${(err as Error).message}); using defaults.\n`);
    return { ...defaultConfig };
  }
}
