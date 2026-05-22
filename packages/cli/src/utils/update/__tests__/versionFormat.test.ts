import { describe, it, expect } from 'vitest';
import { formatLatestCliLine } from '../version.js';

describe('formatLatestCliLine', () => {
  it('shows em dash when latest is unknown', () => {
    expect(formatLatestCliLine(null, '0.1.0')).toContain('—');
    expect(formatLatestCliLine(null, '0.1.0')).toMatch(/Latest CLI:/);
  });

  it('appends up to date when not newer', () => {
    expect(formatLatestCliLine('0.1.0', '0.1.0')).toContain('(up to date)');
  });

  it('omits up to date when newer', () => {
    expect(formatLatestCliLine('0.2.0', '0.1.0')).not.toContain('(up to date)');
    expect(formatLatestCliLine('0.2.0', '0.1.0')).toContain('0.2.0');
  });
});
