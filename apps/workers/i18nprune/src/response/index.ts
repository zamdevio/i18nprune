import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import {
  workerErrorFromCode,
  workerErrorHttpStatus,
  workerProjectNotFoundError,
  workerReportNotFoundError,
  type WorkerApiErrorItem,
  type WorkerApiWarningItem,
} from '@i18nprune/core';
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

  static structuredError(c: Context<WorkerEnv>, error: WorkerApiErrorItem, status?: ContentfulStatusCode) {
    const httpStatus = status ?? workerErrorHttpStatus(error.code);
    return this.error(c, error, httpStatus);
  }

  static badRequest(
    c: Context<WorkerEnv>,
    code: string,
    message: string,
    details?: WorkerApiErrorItem['details'],
  ) {
    return this.structuredError(c, workerErrorFromCode(code, message, details));
  }

  static notFound(
    c: Context<WorkerEnv>,
    code: string,
    message: string,
    details?: WorkerApiErrorItem['details'],
  ) {
    if (code === 'PROJECT_NOT_FOUND') {
      return this.structuredError(c, workerProjectNotFoundError(), 404);
    }
    if (code === 'REPORT_NOT_FOUND') {
      return this.structuredError(c, workerReportNotFoundError(), 404);
    }
    return this.structuredError(c, workerErrorFromCode(code, message, details), 404);
  }
}
