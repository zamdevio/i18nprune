/**
 * Zod schemas for **`share.json`** (local share cache beside disk `files.json` / `analysis.json`).
 * Not part of **`i18nprune` config** — keep here; config schema lives under `config/schema/`.
 */
import { z } from 'zod';
import { normalizeShareCacheEntry } from './canonicalEntry.js';
import type { ShareCacheEntry } from '../../types/share/entry.js';

const shareLinksSchema = z
  .object({
    web: z.string().optional(),
    report: z.string().optional(),
    worker: z.string().optional(),
  })
  .strict();

export const shareCacheEntrySchema = z
  .object({
    kind: z.enum(['project', 'report']),
    workerBaseUrl: z.string().min(1),
    workerProjectId: z.string().min(1).optional(),
    workerReportId: z.string().min(1).optional(),
    payloadContentHash: z.string().min(1),
    configHash: z.string().min(1).optional(),
    inputFilesEpoch: z.string().min(1).optional(),
    byteSize: z.number().int().nonnegative(),
    uploadedAt: z.string().min(1),
    lastUsedAt: z.string().min(1),
    links: shareLinksSchema.default({}),
  })
  .strict()
  .transform((row): ShareCacheEntry => normalizeShareCacheEntry(row as ShareCacheEntry))
  .superRefine((row, ctx) => {
    if (row.kind === 'project' && !row.workerProjectId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'project share entry requires workerProjectId' });
    }
    if (row.kind === 'report' && !row.workerReportId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'report share entry requires workerReportId' });
    }
  });

export const shareJsonFileSchema = z
  .object({
    version: z.literal(1),
    entries: z.array(shareCacheEntrySchema),
  })
  .strict();

