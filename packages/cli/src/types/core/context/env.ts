import { I18NPRUNE_ENV_KEYS } from '@/constants/env.js';

export type I18nPruneEnvKey = (typeof I18NPRUNE_ENV_KEYS)[number];

export type I18nPruneEnvSnapshot = Partial<Record<I18nPruneEnvKey, string | undefined>>;
