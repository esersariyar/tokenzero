import { describe, expect, it } from 'vitest';
import { compressText } from '../src/core/compressText';

describe('compressText', () => {
  it('collapses runs of blank lines', () => {
    const input = 'one\n\n\n\n\ntwo';
    const result = compressText(input);
    expect(result.output).toBe('one\n\ntwo');
    expect(result.savedChars).toBeGreaterThan(0);
  });

  it('preserves fenced code blocks verbatim', () => {
    const input = 'before\n\n\n\n```js\nconst   x   =   1;\n  let y;\n```\n\n\n\nafter';
    const result = compressText(input);
    expect(result.output).toContain('const   x   =   1;');
    expect(result.output).toContain('  let y;');
  });

  it('preserves inline code', () => {
    const input = 'use the `npm   install` command';
    const result = compressText(input);
    expect(result.output).toContain('`npm   install`');
  });

  it('normalizes CRLF to LF', () => {
    const input = 'a\r\nb\r\nc';
    const result = compressText(input);
    expect(result.output).toBe('a\nb\nc');
  });

  it('preserves URLs and emails', () => {
    const input = 'see https://example.com/path?x=1 or mail user@example.com';
    const result = compressText(input);
    expect(result.output).toContain('https://example.com/path?x=1');
    expect(result.output).toContain('user@example.com');
  });

  it('returns metadata fields', () => {
    const result = compressText('hello\n\n\n\nworld');
    expect(result.beforeChars).toBeGreaterThan(0);
    expect(result.afterChars).toBeGreaterThan(0);
    expect(result.beforeTokensEstimate).toBeGreaterThan(0);
    expect(result.afterTokensEstimate).toBeGreaterThan(0);
    expect(result.savedPercent).toBeGreaterThanOrEqual(0);
  });

  it('handles empty input', () => {
    const result = compressText('');
    expect(result.output).toBe('');
    expect(result.savedChars).toBe(0);
  });
});
