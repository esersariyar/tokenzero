import { describe, expect, it } from 'vitest';
import { estimateTokens } from '../src/core/estimateTokens';

describe('estimateTokens', () => {
  it('returns 0 for empty input', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('rounds up chars/4', () => {
    expect(estimateTokens('a')).toBe(1);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2);
    expect(estimateTokens('abcdefgh')).toBe(2);
    expect(estimateTokens('abcdefghi')).toBe(3);
  });
});
