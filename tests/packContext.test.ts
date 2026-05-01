import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { packContext } from '../src/core/packContext';

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'tokenzero-test-'));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

async function write(relPath: string, content: string | Buffer): Promise<void> {
  const abs = path.join(tmp, relPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content);
}

describe('packContext', () => {
  it('includes text files and excludes node_modules and binaries', async () => {
    await write('README.md', '# Hello\n\n\n\nworld');
    await write('data.json', JSON.stringify([{ a: 1, b: 2 }, { a: 3, b: 4 }], null, 2));
    await write('node_modules/foo/index.js', 'module.exports = 1;');
    await write('logo.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]));

    const result = await packContext(['.'], { cwd: tmp });

    expect(result.filesIncluded).toBe(2);
    expect(result.output).toContain('--- file: README.md ---');
    expect(result.output).toContain('--- file: data.json ---');
    expect(result.output).not.toContain('node_modules');
    expect(result.output).not.toContain('logo.png');
  });

  it('writes output file when --out is provided', async () => {
    await write('README.md', '# Hello');
    const outRel = '.tokenzero/context.md';
    const result = await packContext(['.'], { cwd: tmp, out: outRel });
    expect(result.outputPath).toBe(path.resolve(tmp, outRel));
    const written = await fs.readFile(path.resolve(tmp, outRel), 'utf8');
    expect(written).toContain('# Hello');
  });

  it('respects .tokenzeroignore', async () => {
    await write('keep.md', '# Keep');
    await write('drop.md', '# Drop');
    await write('.tokenzeroignore', 'drop.md\n');
    const result = await packContext(['.'], { cwd: tmp });
    expect(result.output).toContain('keep.md');
    expect(result.output).not.toContain('drop.md');
  });

  it('skips files larger than maxBytes by default', async () => {
    await write('small.md', 'tiny');
    await write('big.md', 'x'.repeat(2000));
    const result = await packContext(['.'], { cwd: tmp, maxBytes: 1000 });
    expect(result.output).toContain('small.md');
    expect(result.output).not.toContain('big.md');
  });
});
