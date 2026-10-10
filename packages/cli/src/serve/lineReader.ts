import { SERVE_MAX_LINE_BYTES } from './constants.js';

export type LineReaderHooks = {
  /** A complete line (no trailing newline). */
  readonly onLine: (text: string) => void;
  /** A line exceeded {@link SERVE_MAX_LINE_BYTES} and was discarded. */
  readonly onTooLong: () => void;
  /** A line was not valid UTF-8 and the remainder of that chunk was dropped. */
  readonly onInvalidEncoding: () => void;
  /** stdin ended after any final partial line was flushed through {@link LineReaderHooks.onLine}. */
  readonly onEnd: () => void;
};

/**
 * Accumulate a byte stream into `\n`-split lines. Decoding is incremental and strict so a multi-byte
 * UTF-8 sequence split across chunks is not corrupted, and a broken sequence is reported rather than
 * silently replaced (a corrupted protocol frame is worse than a rejection).
 *
 * The reader owns no streams: it is fed chunks and calls back. {@link LineReader.end} flushes a
 * trailing partial line (some clients close stdin without a final newline) before signalling end.
 */
export class LineReader {
  private decoder = new TextDecoder('utf-8', { fatal: true });
  private buffer = '';
  /** Set when the current (unterminated) line blew past the cap; the rest of it is discarded. */
  private overflowed = false;

  constructor(private readonly hooks: LineReaderHooks) {}

  push(chunk: Buffer): void {
    let text: string;
    try {
      text = this.decoder.decode(chunk, { stream: true });
    } catch {
      this.reset();
      this.hooks.onInvalidEncoding();
      return;
    }
    this.buffer += text;
    this.drain();
    if (!this.overflowed && Buffer.byteLength(this.buffer, 'utf8') > SERVE_MAX_LINE_BYTES) {
      this.overflowed = true;
      this.buffer = '';
      this.hooks.onTooLong();
    }
  }

  /** Signal end-of-stream; flushes a final unterminated line. */
  end(): void {
    let tail = '';
    try {
      tail = this.decoder.decode();
    } catch {
      tail = '';
    }
    this.buffer += tail;
    if (!this.overflowed && this.buffer.length > 0) {
      this.hooks.onLine(this.buffer);
    }
    this.reset();
    this.hooks.onEnd();
  }

  private drain(): void {
    let idx = this.buffer.indexOf('\n');
    while (idx !== -1) {
      const raw = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 1);
      if (this.overflowed) {
        this.overflowed = false;
      } else {
        const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
        if (Buffer.byteLength(line, 'utf8') > SERVE_MAX_LINE_BYTES) {
          this.hooks.onTooLong();
        } else {
          this.hooks.onLine(line);
        }
      }
      idx = this.buffer.indexOf('\n');
    }
  }

  private reset(): void {
    this.decoder = new TextDecoder('utf-8', { fatal: true });
    this.buffer = '';
    this.overflowed = false;
  }
}
