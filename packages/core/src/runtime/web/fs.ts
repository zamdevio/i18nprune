import { I18nPruneError } from '../../shared/errors/internal.js';
import type { RuntimeFsPort, RuntimeReadFsPort } from '../contracts/index.js';

export function createWebReadFsRuntime(input: RuntimeReadFsPort & Partial<RuntimeFsPort>): RuntimeFsPort {
  return {
    exists: input.exists,
    readText: input.readText,
    statKind:
      input.statKind ??
      ((filePath) => (input.exists(filePath) ? 'other' : 'missing')),
    listDir: input.listDir ?? (() => []),
    writeText:
      input.writeText ??
      (() => {
        throw new I18nPruneError('Web runtime fs.writeText is not available for this host adapter', 'USAGE');
      }),
    deleteFile:
      input.deleteFile ??
      (() => {
        throw new I18nPruneError('Web runtime fs.deleteFile is not available for this host adapter', 'USAGE');
      }),
    mkdirp:
      input.mkdirp ??
      (() => {
        throw new I18nPruneError('Web runtime fs.mkdirp is not available for this host adapter', 'USAGE');
      }),
  };
}
