import { describe, it, expect } from 'vitest';
import { compressAnthropicBody } from '../src/proxy/compressMessages';

describe('compressAnthropicBody', () => {
  it('compresses string content in messages', () => {
    const body = {
      model: 'claude-3-5-sonnet-latest',
      messages: [
        { role: 'user', content: 'hello   world\n\n\n\nfoo' },
      ],
    };
    const result = compressAnthropicBody(body);
    expect(result.beforeChars).toBeGreaterThan(0);
    expect(result.afterChars).toBeLessThanOrEqual(result.beforeChars);
    const messages = (result.body as { messages: { content: string }[] }).messages;
    expect(messages[0].content).not.toContain('\n\n\n');
  });

  it('compresses text blocks and leaves other blocks intact', () => {
    const body = {
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'hello   world\n\n\n\nfoo' },
            { type: 'image', source: { type: 'base64', data: 'XXXX' } },
          ],
        },
      ],
    };
    const result = compressAnthropicBody(body);
    const blocks = (result.body as { messages: { content: { type: string; text?: string }[] }[] })
      .messages[0].content;
    expect(blocks[0].type).toBe('text');
    expect(blocks[0].text).not.toContain('\n\n\n');
    expect(blocks[1].type).toBe('image');
  });

  it('compresses system string', () => {
    const body = {
      system: 'you   are    helpful\n\n\n',
      messages: [{ role: 'user', content: 'hi' }],
    };
    const result = compressAnthropicBody(body);
    expect(result.body.system).not.toContain('   ');
  });

  it('returns same shape when no compressible content', () => {
    const body = { model: 'x', messages: [] };
    const result = compressAnthropicBody(body);
    expect(result.beforeChars).toBe(0);
    expect(result.afterChars).toBe(0);
    expect(result.body).toEqual(body);
  });
});
