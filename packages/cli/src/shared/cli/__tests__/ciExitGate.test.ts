import { afterEach, describe, expect, it } from 'vitest';
import { applyCliCiExitGate } from '../ciExitGate.js';

describe('applyCliCiExitGate', () => {
  afterEach(() => {
    process.exitCode = undefined;
  });

  it('sets exit code 1 when ok is false', () => {
    process.exitCode = undefined;
    applyCliCiExitGate(false);
    expect(process.exitCode).toBe(1);
  });

  it('does not set exit code when ok is true', () => {
    process.exitCode = undefined;
    applyCliCiExitGate(true);
    expect(process.exitCode).toBeUndefined();
  });

  it('keeps exit code 1 when already failed and ok is true', () => {
    process.exitCode = 1;
    applyCliCiExitGate(true);
    expect(process.exitCode).toBe(1);
  });
});
