import {
  JSONRPC_INVALID_PARAMS,
  JSONRPC_INVALID_REQUEST,
  JSONRPC_PARSE_ERROR,
  buildError,
  buildResult,
  parseLine,
  serializeMessage,
  type JsonRpcId,
  type JsonRpcInboundMessage,
  type JsonRpcOutbound,
} from './protocol.js';
import { SERVE_DEFAULT_IDLE_TIMEOUT_SECONDS, SERVE_PROTOCOL_VERSION } from './constants.js';
import { LineReader, type LineReaderHooks } from './lineReader.js';
import {
  ProtocolError,
  SERV_ISSUE,
  internalError,
  invalidParams,
  invalidRequest,
  methodNotFound,
  notInitialized,
} from './errors.js';
import { buildInitializeResult, type ServeInitializeResult } from './handshake.js';
import { resolveRequestRoot, type ServeRootConfig } from './roots.js';
import { RootContextCache, type RootContextCacheHost } from './rootContextCache.js';
import { runServeReadOp, SERVE_READ_OP_METHODS, type ServeReadOpId } from './ops.js';
import { getRunOptions } from '@i18nprune/core';
import type { Context, CliGlobalOverrides } from '@/types/core/context/index.js';

/** The only two channels the session may write: protocol on stdout, diagnostics on stderr. */
export type ServeIo = {
  readonly writeStdout: (chunk: string) => void;
  readonly writeStderr: (chunk: string) => void;
};

export type ServeSessionOptions = {
  readonly root: ServeRootConfig;
  /** `--allow-writes`: gates mutating ops (enforced from slice S.4). */
  readonly writes: boolean;
  /** `--idle-timeout <seconds>`; `0` disables. Defaults to {@link SERVE_DEFAULT_IDLE_TIMEOUT_SECONDS}. */
  readonly idleTimeoutSeconds?: number;
  readonly io: ServeIo;
  /** RunOptions the per-root contexts report (serve runs with `json: true`). Defaults to global. */
  readonly run?: Context['run'];
  /** Process exit. Injected so tests own the lifecycle. */
  readonly exit?: (code: number) => void;
  readonly setTimer?: (cb: () => void, ms: number) => ReturnType<typeof setTimeout>;
  readonly clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
};

export type ServeSessionDeps = {
  readonly root: ServeRootConfig;
  readonly writes: boolean;
  readonly idleTimeoutSeconds: number;
  readonly io: ServeIo;
  readonly run: Context['run'];
  readonly cliOverrides: CliGlobalOverrides;
  readonly exit: (code: number) => void;
  readonly setTimer: (cb: () => void, ms: number) => ReturnType<typeof setTimeout>;
  readonly clearTimer: (timer: ReturnType<typeof setTimeout>) => void;
};

/**
 * One stdio session: owns the protocol state machine (handshake, lifecycle, root confinement) and the
 * stdout write path. It holds **no domain logic** — op methods (later slices) delegate to core
 * `runXxx`, and the session only routes, confines, and frames.
 *
 * The load-bearing invariant lives in {@link ServeIo}: this class writes protocol messages to stdout
 * and nothing else. Every diagnostic goes to stderr.
 */
export class ServeSession {
  private readonly deps: ServeSessionDeps;
  private readonly reader: LineReader;
  private initialized = false;
  private shuttingDown = false;
  private finished = false;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly rootCache: RootContextCache;
  /** Serializes op dispatch in arrival order so replies stay ordered. */
  private queue: Promise<void> = Promise.resolve();

  constructor(options: ServeSessionOptions) {
    this.deps = {
      root: options.root,
      writes: options.writes,
      idleTimeoutSeconds: options.idleTimeoutSeconds ?? SERVE_DEFAULT_IDLE_TIMEOUT_SECONDS,
      io: options.io,
      run: options.run ?? getRunOptions(),
      cliOverrides: {},
      exit: options.exit ?? ((code: number) => process.exit(code)),
      setTimer: options.setTimer ?? ((cb, ms) => setTimeout(cb, ms)),
      clearTimer: options.clearTimer ?? ((timer) => clearTimeout(timer)),
    };
    const host: RootContextCacheHost = { run: this.deps.run, cliOverrides: this.deps.cliOverrides };
    this.rootCache = new RootContextCache(host);
    const hooks: LineReaderHooks = {
      onLine: (text) => this.handleLine(text),
      onTooLong: () =>
        this.replyError(
          null,
          new ProtocolError(JSONRPC_INVALID_REQUEST, 'Request line exceeds size limit', SERV_ISSUE.lineTooLong),
        ),
      onInvalidEncoding: () =>
        this.replyError(null, new ProtocolError(JSONRPC_PARSE_ERROR, 'Parse error (invalid UTF-8)', SERV_ISSUE.parseError)),
      onEnd: () => this.onStdinEnd(),
    };
    this.reader = new LineReader(hooks);
  }

  /** Arm the idle backstop. Call once the streams are wired. */
  start(): void {
    this.resetIdleTimer();
    this.stderrLine(`serve: ready (${this.deps.root.mode} mode)`);
  }

  /** Feed a chunk of stdin. */
  handleChunk(chunk: Buffer): void {
    this.reader.push(chunk);
  }

  /** Signal stdin end-of-stream directly (tests / non-stream callers). */
  handleStdinClosed(): void {
    this.reader.end();
  }

  /** Await the dispatch queue to settle (tests: deterministic teardown). */
  async drain(): Promise<void> {
    await this.queue.catch(() => undefined);
  }

  // ── inbound ───────────────────────────────────────────────────────────────

  private handleLine(text: string): void {
    if (this.finished) return;
    this.resetIdleTimer();
    const trimmed = text.trim();
    if (trimmed === '') return;
    const parsed = parseLine(trimmed);
    switch (parsed.frame) {
      case 'parse_error':
        this.replyError(
          null,
          new ProtocolError(JSONRPC_PARSE_ERROR, 'Parse error', SERV_ISSUE.parseError),
        );
        return;
      case 'invalid_request':
        this.replyError(parsed.id, invalidRequest('Invalid Request'));
        return;
      case 'message':
        this.handleInbound(parsed.message);
        return;
    }
  }

  private handleInbound(msg: JsonRpcInboundMessage): void {
    if (msg.id === null) {
      this.handleNotification(msg);
      return;
    }
    // Queue requests so replies stay in arrival order even when a handler awaits disk I/O.
    this.queue = this.queue.then(async () => {
      if (this.finished) return;
      try {
        const result = await this.dispatchRequest(msg);
        this.reply(buildResult(msg.id!, result));
      } catch (err) {
        this.replyError(msg.id, err);
      }
    });
  }

  private handleNotification(msg: JsonRpcInboundMessage): void {
    if (msg.method === 'exit') {
      this.finish(0);
      return;
    }
    // Unknown notifications (incl. `$/cancelRequest` before S.3) are ignored by JSON-RPC contract.
  }

  private async dispatchRequest(msg: JsonRpcInboundMessage): Promise<unknown> {
    if (msg.method === 'initialize') return this.onInitialize(msg);
    if (!this.initialized) throw notInitialized();
    if (this.shuttingDown) {
      throw new ProtocolError(JSONRPC_INVALID_REQUEST, 'Server is shutting down', SERV_ISSUE.shuttingDown);
    }
    switch (msg.method) {
      case 'shutdown':
        return this.onShutdown();
      case 'ping':
        return {};
      default:
        return this.dispatchOp(msg);
    }
  }

  /** Route `op.*` methods to read ops; unknown / not-yet-wired methods are method-not-found. */
  private async dispatchOp(msg: JsonRpcInboundMessage): Promise<unknown> {
    const opId = (SERVE_READ_OP_METHODS as Record<string, ServeReadOpId | undefined>)[msg.method];
    if (opId === undefined) throw methodNotFound(msg.method);
    const p = this.asParamsObject(msg.params);
    const root = this.resolveRoot(typeof p.projectRoot === 'string' ? p.projectRoot : undefined);
    const options = this.asOptionsObject(p.options);
    const result = await runServeReadOp(opId, {
      projectRoot: root,
      run: this.deps.run,
      cliOverrides: this.deps.cliOverrides,
      options,
      getContext: () => this.rootCache.get(root),
    });
    return result.envelope;
  }

  private asOptionsObject(options: unknown): Record<string, unknown> {
    if (options === undefined || options === null) return {};
    if (typeof options !== 'object' || Array.isArray(options)) {
      throw invalidParams('`options` must be an object');
    }
    return options as Record<string, unknown>;
  }

  private onInitialize(msg: JsonRpcInboundMessage): ServeInitializeResult {
    if (this.initialized) throw invalidRequest('Already initialized');
    const p = this.asParamsObject(msg.params);
    const clientVersion = p.protocolVersion;
    if (typeof clientVersion !== 'string' || clientVersion === '') {
      throw invalidParams('initialize requires a string `protocolVersion`');
    }
    if (clientVersion !== SERVE_PROTOCOL_VERSION) {
      throw new ProtocolError(
        JSONRPC_INVALID_PARAMS,
        `Unsupported protocolVersion ${clientVersion} (this server speaks ${SERVE_PROTOCOL_VERSION})`,
        SERV_ISSUE.unsupportedProtocolVersion,
      );
    }
    this.initialized = true;
    const result = buildInitializeResult(this.deps.root, { writes: this.deps.writes });
    this.stderrLine(`serve: initialized (${result.rootMode} mode, protocol ${result.protocolVersion})`);
    this.resetIdleTimer();
    return result;
  }

  private onShutdown(): Record<string, never> {
    this.shuttingDown = true;
    this.clearIdleTimer();
    this.stderrLine('serve: shutdown requested — awaiting exit');
    return {};
  }

  private asParamsObject(params: unknown): Record<string, unknown> {
    if (params === undefined || params === null) return {};
    if (typeof params !== 'object' || Array.isArray(params)) {
      throw invalidParams('params must be an object');
    }
    return params as Record<string, unknown>;
  }

  // ── outbound ──────────────────────────────────────────────────────────────

  private reply(message: JsonRpcOutbound): void {
    this.deps.io.writeStdout(serializeMessage(message));
  }

  private replyError(id: JsonRpcId | null, err: unknown): void {
    if (err instanceof ProtocolError) {
      if (err.issueCode === SERV_ISSUE.internalError) this.stderrLine(`serve: error — ${err.message}`);
      this.reply(buildError(id, err.code, err.message, { code: err.issueCode }));
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    this.stderrLine(`serve: internal error — ${message}`);
    const fallback = internalError('Internal error');
    this.reply(buildError(id, fallback.code, fallback.message, { code: fallback.issueCode }));
  }

  private stderrLine(line: string): void {
    this.deps.io.writeStderr(`${line}\n`);
  }

  // ── lifecycle ─────────────────────────────────────────────────────────────

  private onStdinEnd(): void {
    if (this.finished) return;
    this.stderrLine('serve: stdin closed');
    this.finish(0);
  }

  private finish(code: number): void {
    if (this.finished) return;
    this.finished = true;
    this.clearIdleTimer();
    this.deps.exit(code);
  }

  private resetIdleTimer(): void {
    this.clearIdleTimer();
    const seconds = this.deps.idleTimeoutSeconds;
    if (seconds <= 0 || this.finished) return;
    this.idleTimer = this.deps.setTimer(() => {
      this.stderrLine(`serve: idle timeout after ${seconds}s — exiting`);
      this.finish(0);
    }, seconds * 1000);
    this.idleTimer.unref?.();
  }

  private clearIdleTimer(): void {
    if (this.idleTimer !== null) {
      this.deps.clearTimer(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * Resolve the root an op request targets, enforcing the session mode. Placeholder consumer for the
   * S.2 slice so confinement is wired from day one rather than bolted on.
   */
  resolveRoot(requested?: string): string {
    const resolution = resolveRequestRoot(this.deps.root, requested);
    if (resolution.ok) return resolution.root;
    switch (resolution.reason) {
      case 'required':
        throw invalidParams('`projectRoot` is required in hub mode');
      case 'relative':
        throw invalidParams('`projectRoot` must be absolute');
      case 'confined':
        throw invalidRequest(
          'Request targets a project root outside this sandboxed session',
          SERV_ISSUE.projectConfined,
        );
    }
  }
}
