import { compressText } from '../core/compressText';

type AnthropicTextBlock = { type: 'text'; text: string; [k: string]: unknown };
type AnthropicContentBlock = AnthropicTextBlock | { type: string; [k: string]: unknown };
type AnthropicMessage = {
  role: string;
  content: string | AnthropicContentBlock[];
  [k: string]: unknown;
};

export type CompressMessagesResult = {
  body: Record<string, unknown>;
  beforeChars: number;
  afterChars: number;
};

function compressString(value: string): { output: string; before: number; after: number } {
  const result = compressText(value);
  return { output: result.output, before: result.beforeChars, after: result.afterChars };
}

function compressContentBlocks(blocks: AnthropicContentBlock[]): {
  blocks: AnthropicContentBlock[];
  before: number;
  after: number;
} {
  let before = 0;
  let after = 0;
  const out: AnthropicContentBlock[] = blocks.map((block) => {
    if (block && block.type === 'text' && typeof (block as AnthropicTextBlock).text === 'string') {
      const { output, before: b, after: a } = compressString((block as AnthropicTextBlock).text);
      before += b;
      after += a;
      return { ...block, text: output };
    }
    return block;
  });
  return { blocks: out, before, after };
}

function compressMessage(message: AnthropicMessage): {
  message: AnthropicMessage;
  before: number;
  after: number;
} {
  if (typeof message.content === 'string') {
    const { output, before, after } = compressString(message.content);
    return { message: { ...message, content: output }, before, after };
  }
  if (Array.isArray(message.content)) {
    const { blocks, before, after } = compressContentBlocks(message.content);
    return { message: { ...message, content: blocks }, before, after };
  }
  return { message, before: 0, after: 0 };
}

function compressSystem(system: unknown): { system: unknown; before: number; after: number } {
  if (typeof system === 'string') {
    const { output, before, after } = compressString(system);
    return { system: output, before, after };
  }
  if (Array.isArray(system)) {
    const { blocks, before, after } = compressContentBlocks(system as AnthropicContentBlock[]);
    return { system: blocks, before, after };
  }
  return { system, before: 0, after: 0 };
}

export function compressAnthropicBody(body: Record<string, unknown>): CompressMessagesResult {
  let beforeChars = 0;
  let afterChars = 0;
  const next: Record<string, unknown> = { ...body };

  if ('system' in body) {
    const { system, before, after } = compressSystem(body.system);
    next.system = system;
    beforeChars += before;
    afterChars += after;
  }

  if (Array.isArray(body.messages)) {
    next.messages = (body.messages as AnthropicMessage[]).map((m) => {
      const { message, before, after } = compressMessage(m);
      beforeChars += before;
      afterChars += after;
      return message;
    });
  }

  return { body: next, beforeChars, afterChars };
}
