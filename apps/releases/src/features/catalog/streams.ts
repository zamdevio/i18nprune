/** Stream metadata (CLI, Core SDK, Extension) for badges and navigation. */
import type { StreamId } from '@/types';

export type StreamMeta = {
  id: StreamId;
  label: string;
  description: string;
  npmUrl: string | null;
  colorClass: string;
  bgClass: string;
  textClass: string;
};

export const STREAM_META: Record<StreamId, StreamMeta> = {
  cli: {
    id: 'cli',
    label: 'CLI',
    description: 'Global command-line tool',
    npmUrl: 'https://www.npmjs.com/package/i18nprune',
    colorClass: 'stream-cli',
    bgClass: 'bg-stream-cli',
    textClass: 'text-stream-cli',
  },
  core: {
    id: 'core',
    label: 'Core SDK',
    description: 'Programmatic Node.js library',
    npmUrl: 'https://www.npmjs.com/package/@i18nprune/core',
    colorClass: 'stream-core',
    bgClass: 'bg-stream-core',
    textClass: 'text-stream-core',
  },
  extension: {
    id: 'extension',
    label: 'Extension',
    description: 'VS Code extension (coming soon)',
    npmUrl: null,
    colorClass: 'stream-extension',
    bgClass: 'bg-stream-extension',
    textClass: 'text-stream-extension',
  },
};

export const STREAM_IDS: StreamId[] = ['cli', 'core', 'extension'];

export function isStreamId(value: string | undefined): value is StreamId {
  return value === 'cli' || value === 'core' || value === 'extension';
}
