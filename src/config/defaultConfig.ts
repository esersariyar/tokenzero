import type { TokenZeroConfig } from '../types';

export const DEFAULT_MAX_BYTES = 512 * 1024;

export const defaultConfig: TokenZeroConfig = {
  maxBytes: DEFAULT_MAX_BYTES,
  compressText: true,
  compressJson: true,
  out: '.tokenzero/context.md',
  ignore: [],
};
