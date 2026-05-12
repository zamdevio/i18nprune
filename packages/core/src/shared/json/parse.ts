import type { CliErrorCode } from '../../types/errors/index.js';
import { I18nPruneError } from '../errors/index.js';

export type JsonParseLocation = {
  line?: number;
  column?: number;
  offset?: number;
};

export type ParseJsonTextOptions = {
  filePath?: string;
  code?: CliErrorCode;
  issueCode?: string;
};

export class I18nPruneJsonParseError extends I18nPruneError {
  public readonly filePath: string | undefined;
  public readonly line: number | undefined;
  public readonly column: number | undefined;
  public readonly offset: number | undefined;

  constructor(input: {
    message: string;
    code: CliErrorCode;
    cause: unknown;
    issueCode?: string;
    filePath?: string;
    location: JsonParseLocation;
  }) {
    const options =
      input.issueCode !== undefined ? { cause: input.cause, issueCode: input.issueCode } : { cause: input.cause };
    super(input.message, input.code, options);
    this.name = 'I18nPruneJsonParseError';
    this.filePath = input.filePath;
    this.line = input.location.line;
    this.column = input.location.column;
    this.offset = input.location.offset;
  }
}

function locationFromOffset(text: string, offset: number): JsonParseLocation {
  let line = 1;
  let column = 1;
  const capped = Math.max(0, Math.min(offset, text.length));
  for (let i = 0; i < capped; i += 1) {
    if (text.charCodeAt(i) === 10) {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column, offset };
}

export function getJsonParseLocation(error: unknown, text: string): JsonParseLocation {
  const message = error instanceof Error ? error.message : String(error);
  const positionMatch = /\bposition\s+(\d+)\b/i.exec(message);
  if (positionMatch?.[1]) {
    return locationFromOffset(text, Number.parseInt(positionMatch[1], 10));
  }
  const lineColumnMatch = /\bline\s+(\d+)\s+column\s+(\d+)\b/i.exec(message);
  if (lineColumnMatch?.[1] && lineColumnMatch[2]) {
    return {
      line: Number.parseInt(lineColumnMatch[1], 10),
      column: Number.parseInt(lineColumnMatch[2], 10),
    };
  }
  return {};
}

function formatJsonParseMessage(filePath: string | undefined, location: JsonParseLocation, cause: unknown): string {
  const subject = filePath ? `Invalid JSON in ${filePath}` : 'Invalid JSON';
  const at =
    location.line !== undefined && location.column !== undefined
      ? ` at line ${String(location.line)}, column ${String(location.column)}`
      : location.offset !== undefined
        ? ` at offset ${String(location.offset)}`
        : '';
  const detail = cause instanceof Error ? cause.message : String(cause);
  return `${subject}${at}: ${detail}`;
}

export function parseJsonText<T = unknown>(text: string, options: ParseJsonTextOptions = {}): T {
  try {
    return JSON.parse(text) as T;
  } catch (cause) {
    const location = getJsonParseLocation(cause, text);
    throw new I18nPruneJsonParseError({
      message: formatJsonParseMessage(options.filePath, location, cause),
      code: options.code ?? 'IO',
      cause,
      location,
      ...(options.issueCode !== undefined ? { issueCode: options.issueCode } : {}),
      ...(options.filePath !== undefined ? { filePath: options.filePath } : {}),
    });
  }
}

export type TryParseJsonTextResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: I18nPruneJsonParseError };

export function tryParseJsonText<T = unknown>(
  text: string,
  options: ParseJsonTextOptions = {},
): TryParseJsonTextResult<T> {
  try {
    return { ok: true, data: parseJsonText<T>(text, options) };
  } catch (error) {
    if (error instanceof I18nPruneJsonParseError) return { ok: false, error };
    throw error;
  }
}
