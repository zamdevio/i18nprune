import type { CANONICAL_SUBCOMMANDS } from '@/argv/index.js';

export type CanonicalSubcommand = (typeof CANONICAL_SUBCOMMANDS)[number];
