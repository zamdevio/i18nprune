import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { WorkerEnv } from '../routes/types';

export interface ResponseErrorItem {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseWarningItem {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

type ResponseMeta = Record<string, unknown>;

export class ApiResponse {
  static success<T>(
    c: Context<WorkerEnv>,
    data: T,
    status: ContentfulStatusCode = 200,
    warnings: ResponseWarningItem[] = [],
    meta?: ResponseMeta,
    code = 'OK',
  ) {
    return c.json(
      {
        code,
        success: true,
        data,
        errors: [] as ResponseErrorItem[],
        warnings,
        meta,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }

  static error(
    c: Context<WorkerEnv>,
    error: ResponseErrorItem,
    status: ContentfulStatusCode = 500,
    warnings: ResponseWarningItem[] = [],
  ) {
    return c.json(
      {
        code: error.code,
        success: false,
        data: null,
        errors: [error],
        warnings,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }

  static badRequest(c: Context<WorkerEnv>, code: string, message: string, details?: Record<string, unknown>) {
    return this.error(c, { code, message, details }, 400);
  }

  static notFound(c: Context<WorkerEnv>, code: string, message: string, details?: Record<string, unknown>) {
    return this.error(c, { code, message, details }, 404);
  }
}
