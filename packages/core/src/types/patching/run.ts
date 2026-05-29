import type { ResolvedLocalesLayout } from '../locales/layout.js';
import type {
  PatchingAction,
  PatchingCommandName,
  PatchingConfigInput,
  PatchingLocaleRecord,
  PatchingRuntimePorts,
} from './config.js';

export type PatchingRunInput = {
  command: PatchingCommandName;
  action: PatchingAction;
  changedLocaleCodes: string[];
  /** Optional records for upsert operations that need exact metadata rather than catalog defaults. */
  upsertLocaleRecords?: readonly PatchingLocaleRecord[];
  sourceLocaleCode?: string;
  config?: PatchingConfigInput;
  runtime: PatchingRuntimePorts;
  /**
   * Root for resolving relative **`configPath`**, **`loaderPath`**, and **`localeJsonImportBase`** (directory of
   * **`i18nprune.config.*`** in normal CLI runs). Unit tests may omit and resolve **`localeJsonImportBase`**
   * from **`loaderPath`**’s directory instead.
   */
  projectRoot?: string;
  /**
   * When **`true`**, completeness checks behave as if **`--patch`** forced a patching run
   * (e.g. **doctor** with global **`--patch`** even if **`patching.enabled`** is false).
   */
  treatAsPatchRequested?: boolean;
  /** Resolved i18nprune locales layout — enables multi-segment locale discovery and loader imports. */
  localesLayout?: ResolvedLocalesLayout;
};
