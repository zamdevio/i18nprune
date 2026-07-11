import { describe, expect, it, vi } from 'vitest';
import type { RunEmitter, RunEvent } from '../../types/shared/run/index.js';
import { emitGenerateSentinelRepairHumanMessages } from '../sentinelHumanEmit.js';

describe('emitGenerateSentinelRepairHumanMessages', () => {
  it('respects listLimit and emits omitted suffix', () => {
    const messages: string[] = [];
    const emit = vi.fn((event: RunEvent) => {
      if (event.type === 'run.message') messages.push(event.message);
    }) as RunEmitter;
    emitGenerateSentinelRepairHumanMessages(emit, 'run-1', {
      localeCode: 'ar',
      dryRun: true,
      listLimit: 1,
      repairs: [
        { path: 'a', mode: 'placeholder_copy', from: '__I18NPRUNE_0__', to: '{{a}}' },
        { path: 'b', mode: 'placeholder_copy', from: '__I18NPRUNE_1__', to: '{{b}}' },
        { path: 'c', mode: 'translate', from: '__I18NPRUNE_2__', to: 'text' },
      ],
    });
    expect(messages[0]).toContain('Would repair 3 placeholder sentinel leak(s)');
    expect(messages.filter((line) => line.includes('(placeholder_copy):'))).toHaveLength(1);
    expect(messages.some((line) => line.includes('… 2 more (use --full or --top <n>)'))).toBe(true);
  });
});
