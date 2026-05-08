import { describe, expect, it } from 'vitest';
import { parseOpenAiChatCompletionContent } from '../index.js';

describe('parseOpenAiChatCompletionContent', () => {
  it('reads string content', () => {
    const json = {
      choices: [{ message: { role: 'assistant', content: 'Hola' } }],
    };
    expect(parseOpenAiChatCompletionContent(json)).toBe('Hola');
  });
});
