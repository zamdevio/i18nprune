import { I18nPruneError, setRunOptions } from '@i18nprune/core';
import { ServeSession, type ServeIo } from './session.js';
import { normalizeServeRoot, type ServeRootConfig } from './roots.js';

/** Parsed `i18nprune serve` CLI options (Commander hands these in from `bin/cli.ts`). */
export type ServeOptions = {
  /** `--project <path>` — pins the session to one root (sandbox mode). Omitted ⇒ hub mode. */
  readonly project?: string;
  /** `--allow-writes` — opt in to mutating ops (default read-only). */
  readonly allowWrites?: boolean;
  /** `--idle-timeout <seconds>` — backstop exit after inactivity; `0` disables. */
  readonly idleTimeout?: string;
};

function resolveServeRootConfig(project: string | undefined): ServeRootConfig {
  if (project === undefined || project.trim() === '') return { mode: 'hub' };
  return { mode: 'sandbox', root: normalizeServeRoot(project.trim()) };
}

/** `undefined` ⇒ session default; `0` ⇒ disabled; otherwise the parsed positive second count. */
function parseIdleTimeout(raw: string | undefined): number | undefined {
  if (raw === undefined || raw.trim() === '') return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0 || String(n) !== raw.trim()) {
    throw new I18nPruneError(
      `serve: --idle-timeout must be 0 (disabled) or a positive integer of seconds (got ${raw})`,
      'USAGE',
    );
  }
  return n;
}

/**
 * `i18nprune serve` — run the stdio JSON-RPC transport until stdin closes, `exit` arrives, or the
 * idle backstop fires.
 *
 * stdout is the protocol stream and nothing else: the session writes only framed messages there, and
 * every diagnostic goes to stderr through {@link ServeIo}. This function additionally silences the
 * human logger so no helper reached by a later op slice can leak a `console.log` line into the stream,
 * and `bin/cli.ts` skips the command banner / update notice for `serve`.
 */
export async function serve(opts: ServeOptions): Promise<void> {
  setRunOptions({ quiet: true, silent: true, debugScan: false, debugCache: false });

  const root = resolveServeRootConfig(opts.project);
  const idleTimeoutSeconds = parseIdleTimeout(opts.idleTimeout);

  const io: ServeIo = {
    writeStdout: (chunk) => {
      process.stdout.write(chunk);
    },
    writeStderr: (chunk) => {
      process.stderr.write(chunk);
    },
  };

  const session = new ServeSession({
    root,
    writes: opts.allowWrites === true,
    idleTimeoutSeconds,
    io,
    // Set the exit code and let the event loop drain instead of hard-exiting mid-write: stdout on a
    // pipe is asynchronous, so the empty-write callback is used as a flush barrier before exiting.
    exit: (code) => {
      process.exitCode = code;
      process.stdin.pause();
      process.stdout.write('', () => {
        process.exit(code);
      });
    },
  });

  process.stdin.on('data', (chunk: Buffer) => {
    session.handleChunk(chunk);
  });
  process.stdin.on('end', () => {
    session.handleStdinClosed();
  });
  process.stdin.on('error', () => {
    session.handleStdinClosed();
  });
  process.stdin.resume();
  session.start();
}
