import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

export const GIT_APP_ROOT = path.resolve(scriptsDir, '../..');
export const REPO_ROOT = path.resolve(GIT_APP_ROOT, '../..');
export const DATA_DIR = path.join(GIT_APP_ROOT, 'src/data');
export const PHASES_CONFIG = path.join(GIT_APP_ROOT, 'scripts/phases.config.json');
