import path from 'node:path';

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.kt', '.scala',
  '.c', '.h', '.cc', '.cpp', '.hpp', '.cs',
  '.php', '.swift', '.m', '.mm',
  '.css', '.scss', '.sass', '.less',
  '.html', '.htm', '.xml', '.svg',
  '.vue', '.svelte', '.astro',
  '.md', '.mdx', '.markdown', '.txt', '.rst', '.adoc',
  '.json', '.jsonc', '.json5',
  '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
  '.sh', '.bash', '.zsh', '.fish', '.ps1',
  '.sql', '.graphql', '.gql',
  '.env',
  '.gitignore', '.npmignore', '.dockerignore', '.editorconfig',
]);

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.tif', '.tiff',
  '.mp4', '.mp3', '.wav', '.ogg', '.mov', '.avi', '.mkv', '.flac', '.m4a',
  '.zip', '.tar', '.gz', '.tgz', '.7z', '.rar', '.bz2', '.xz',
  '.pdf', '.exe', '.dll', '.so', '.dylib', '.wasm', '.bin', '.dat',
  '.o', '.a', '.class', '.jar', '.pyc',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.psd', '.ai', '.sketch', '.fig',
  '.db', '.sqlite', '.sqlite3',
]);

export function isLikelyTextByExtension(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) return false;
  if (TEXT_EXTENSIONS.has(ext)) return true;
  const base = path.basename(filePath).toLowerCase();
  if (base.startsWith('.') && !ext) return true;
  return ext === '';
}

export function isBinaryByExtension(filePath: string): boolean {
  return BINARY_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

export function looksBinary(buffer: Buffer): boolean {
  const len = Math.min(buffer.length, 8192);
  for (let i = 0; i < len; i++) {
    if (buffer[i] === 0) return true;
  }
  return false;
}
