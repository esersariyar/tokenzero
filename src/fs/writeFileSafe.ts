import fs from 'node:fs/promises';
import path from 'node:path';

export async function writeFileSafe(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(path.resolve(filePath));
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    throw new Error(`Failed to create directory ${dir}: ${(err as Error).message}`);
  }
  try {
    await fs.writeFile(filePath, content, 'utf8');
  } catch (err) {
    throw new Error(`Failed to write file ${filePath}: ${(err as Error).message}`);
  }
}
