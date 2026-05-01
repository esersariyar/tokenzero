import fs from 'node:fs/promises';
import path from 'node:path';
import { compressText } from '../../core/compressText';
import { writeFileSafe } from '../../fs/writeFileSafe';

export type CompressCommandFlags = {
  out?: string;
};

export async function runCompress(file: string, flags: CompressCommandFlags): Promise<void> {
  const absolute = path.resolve(process.cwd(), file);
  const input = await fs.readFile(absolute, 'utf8');
  const result = compressText(input);

  if (flags.out) {
    await writeFileSafe(path.resolve(process.cwd(), flags.out), result.output);
  } else {
    process.stdout.write(result.output);
    if (!result.output.endsWith('\n')) process.stdout.write('\n');
  }

  process.stderr.write(
    `tokenzero compress: ${result.beforeChars} -> ${result.afterChars} chars (${result.savedPercent}% saved, ~${result.beforeTokensEstimate} -> ~${result.afterTokensEstimate} tokens)\n`,
  );
}
