import fs from 'node:fs/promises';
import path from 'node:path';
import { compressJson } from '../../core/compressJson';
import { writeFileSafe } from '../../fs/writeFileSafe';

export type JsonCommandFlags = {
  out?: string;
};

export async function runJson(file: string, flags: JsonCommandFlags): Promise<void> {
  const absolute = path.resolve(process.cwd(), file);
  const input = await fs.readFile(absolute, 'utf8');
  const result = compressJson(input);

  if (flags.out) {
    await writeFileSafe(path.resolve(process.cwd(), flags.out), result.output);
  } else {
    process.stdout.write(result.output);
    if (!result.output.endsWith('\n')) process.stdout.write('\n');
  }

  process.stderr.write(
    `tokenzero json: ${result.beforeChars} -> ${result.afterChars} chars (${result.savedPercent}% saved, ~${result.beforeTokensEstimate} -> ~${result.afterTokensEstimate} tokens)\n`,
  );
}
