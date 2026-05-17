/** Public patching engine facade (types: `packages/core/src/types/patching/`). */

// Completeness / config-shape helpers
export { buildPatchingSectionIncompleteDiagnostic, patchingBlockPresent } from './sectionCompleteness.js';

// Recipe detection
export { detectPatchingRecipe } from './recipe.js';

// Plan → apply pipeline (sub-barrel: `./planning/`)
export { buildPatchPlan } from './planning/index.js';
export * as planning from './planning/index.js';

// Analysis + execution
export { analyzePatchingState } from './analyze.js';
export { applyPatchPlanAtomic } from './apply.js';
export { runPatching } from './run.js';

// Locale metadata JSON repair (pure)
export { resolvePatchingConfigLocales } from './resolver.js';

// Generated loader strings (sub-barrel: `./render/`)
export { composeLoadersGeneratedFile, renderGeneratedInnerBlock } from './render/index.js';
export * as render from './render/index.js';
