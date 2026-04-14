/**
 * During multi-line stderr progress, put stdin in raw mode so stray keypresses do not echo
 * or corrupt the display. Ctrl+C and Ctrl+Z are forwarded to the process (SIGINT / SIGTSTP).
 */
export function attachStdinDiscardDuringProgress(): () => void {
  const stdin = process.stdin;
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    return () => {};
  }

  let active = true;

  const onData = (buf: Buffer | string): void => {
    if (!active) return;
    const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
    for (let i = 0; i < b.length; i += 1) {
      const c = b[i]!;
      if (c === 0x03) {
        process.kill(process.pid, 'SIGINT');
        continue;
      }
      if (c === 0x1a) {
        if (process.platform !== 'win32') {
          process.kill(process.pid, 'SIGTSTP');
        }
        continue;
      }
    }
  };

  try {
    stdin.setRawMode(true);
  } catch {
    return () => {};
  }
  stdin.resume();
  stdin.on('data', onData);

  return () => {
    if (!active) return;
    active = false;
    stdin.removeListener('data', onData);
    try {
      if (stdin.isTTY && typeof stdin.setRawMode === 'function') {
        stdin.setRawMode(false);
      }
    } catch {}
    try {
      stdin.pause();
    } catch {
      /* ignore */
    }
  };
}
