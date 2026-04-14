import type { z } from 'zod';
import type { configSchema } from '@/config/schema.js';

export type ParsedI18nPruneConfig = z.infer<typeof configSchema>;
