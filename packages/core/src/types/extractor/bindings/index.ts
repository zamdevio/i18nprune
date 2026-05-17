/**
 * Where a binding came from syntactically (regex scan — no AST).
 *
 * @remarks Arbitrary variable propagation (e.g. `const x = getI18n()`) is intentionally out of scope.
 */
export type ImportBindingSource =
  | 'esm'
  | 'cjs_require'
  | 'dynamic_import'
  | 'ts_import_equals';

/**
 * A resolved import-related binding used to expand configured `functions[]`.
 *
 * @remarks Two shapes: **named** (direct calls `t()`, `translate()`) and **module**
 * (member calls `i18n.t()`, `i18n?.t()` after expansion). Regex-based only — string literals
 * and nested generics can false-positive. Bracket calls like `i18n['t']()` are not modeled here;
 * call-site regex would need a separate extension.
 */
export type ImportBinding =
  | {
      kind: 'named';
      /** Exported / property name (`t` in `import { t as translate }`). */
      imported: string;
      /** Local identifier used in the file. */
      local: string;
      source: ImportBindingSource;
      /**
       * When set, runtime call detection must ignore this binding
       * (e.g. `import type { TFunction }`).
       */
      isTypeOnly?: true;
    }
  | {
      kind: 'module';
      /** Local identifier (`i18n` in `import * as i18n`). */
      local: string;
      moduleKind: 'default' | 'namespace';
      source: ImportBindingSource;
      isTypeOnly?: true;
    };
