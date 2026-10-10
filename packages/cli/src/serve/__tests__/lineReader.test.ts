import { describe, expect, it } from 'vitest';
import { LineReader, type LineReaderHooks } from '@/serve/lineReader.js';

function collect() {
  const lines: string[] = [];
  let tooLong = 0;
  let badEncoding = 0;
  let ends = 0;
  const hooks: LineReaderHooks = {
    onLine: (l) => lines.push(l),
    onTooLong: () => (tooLong += 1),
    onInvalidEncoding: () => (badEncoding += 1),
    onEnd: () => (ends += 1),
  };
  return {
    reader: new LineReader(hooks),
    lines,
    tooLong: () => tooLong,
    badEncoding: () => badEncoding,
    ends: () => ends,
  };
}

describe('LineReader', () => {
  it('splits chunks into newline-terminated lines', () => {
    const h = collect();
    h.reader.push(Buffer.from('a\nb\nc', 'utf8'));
    expect(h.lines).toEqual(['a', 'b']);
    h.reader.end();
    expect(h.lines).toEqual(['a', 'b', 'c']);
    expect(h.ends()).toBe(1);
  });

  it('reassembles a line split across chunk boundaries', () => {
    const h = collect();
    h.reader.push(Buffer.from('{"jsonrpc"', 'utf8'));
    h.reader.push(Buffer.from(':"2.0"}\n', 'utf8'));
    expect(h.lines).toEqual(['{"jsonrpc":"2.0"}']);
  });

  it('does not corrupt a multi-byte UTF-8 sequence split across chunks', () => {
    const bytes = Buffer.from('π\n', 'utf8');
    const h = collect();
    h.reader.push(bytes.subarray(0, 1));
    h.reader.push(bytes.subarray(1));
    expect(h.lines).toEqual(['π']);
  });

  it('strips a trailing carriage return', () => {
    const h = collect();
    h.reader.push(Buffer.from('x\r\ny\r\n', 'utf8'));
    expect(h.lines).toEqual(['x', 'y']);
  });

  it('reports invalid UTF-8 without throwing', () => {
    const h = collect();
    h.reader.push(Buffer.from([0xff, 0xfe, 0x0a]));
    expect(h.badEncoding()).toBe(1);
  });

  it('reports an over-long line and resyncs on the next newline', () => {
    const h = collect();
    const big = Buffer.from(`${'x'.repeat(17 * 1024 * 1024)}\n`, 'utf8');
    h.reader.push(big);
    expect(h.tooLong()).toBe(1);
    expect(h.lines).toEqual([]);
    h.reader.push(Buffer.from('ok\n', 'utf8'));
    expect(h.lines).toEqual(['ok']);
  });
});
