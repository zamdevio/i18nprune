import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { WorkerApiErrorItem, WorkerApiWarningItem } from '@i18nprune/core';
import type { WorkerEnv } from '../routes/types';

type ResponseMeta = Record<string, unknown>;

export class ApiResponse {
  static success<T>(
    c: Context<WorkerEnv>,
    data: T,
    status: ContentfulStatusCode = 200,
    warnings: WorkerApiWarningItem[] = [],
    meta?: ResponseMeta,
    code = 'OK',
  ) {
    return c.json(
      {
        code,
        success: true,
        data,
        errors: [] as WorkerApiErrorItem[],
        warnings,
        meta,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }

  static error(
    c: Context<WorkerEnv>,
    error: WorkerApiErrorItem,
    status: ContentfulStatusCode = 500,
    warnings: WorkerApiWarningItem[] = [],
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
