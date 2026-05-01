import { describe, expect, it } from 'vitest';
import { compressJson } from '../src/core/compressJson';

describe('compressJson', () => {
  it('converts uniform array of primitive objects to a table', () => {
    const input = JSON.stringify(
      [
        { name: 'Project Alpha', status: 'active', owner: 'Alice', priority: 'high' },
        { name: 'Project Beta', status: 'paused', owner: 'Bob', priority: 'medium' },
      ],
      null,
      2,
    );
    const result = compressJson(input);
    expect(result.output).toBe(
      [
        'cols: name | status | owner | priority',
        'Project Alpha | active | Alice | high',
        'Project Beta | paused | Bob | medium',
      ].join('\n'),
    );
    expect(result.savedChars).toBeGreaterThan(0);
  });

  it('falls back to compact JSON for non-uniform arrays', () => {
    const input = JSON.stringify([{ a: 1 }, { a: 1, b: 2 }]);
    const result = compressJson(input);
    expect(result.output).toBe('[{"a":1},{"a":1,"b":2}]');
  });

  it('falls back to compact JSON for nested objects', () => {
    const input = JSON.stringify([{ a: { x: 1 } }, { a: { x: 2 } }]);
    const result = compressJson(input);
    expect(result.output).toBe('[{"a":{"x":1}},{"a":{"x":2}}]');
  });

  it('returns input unchanged on parse error', () => {
    const input = '{not json';
    const result = compressJson(input);
    expect(result.output).toBe(input);
    expect(result.savedChars).toBe(0);
  });

  it('escapes pipes inside cell values', () => {
    const input = JSON.stringify([
      { a: 'x|y', b: 'z' },
      { a: 'p', b: 'q' },
    ]);
    const result = compressJson(input);
    expect(result.output).toContain('x\\|y');
  });
});
