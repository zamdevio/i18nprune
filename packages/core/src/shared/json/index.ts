export { splitPath, getAtPath, setAtPath, deleteAtPath } from './path.js';
export type { PathSegment } from '../../types/json/path/index.js';
export { deepClone } from './clone.js';
export { collectStringLeaves } from './leaves.js';
export { mergeToTemplateShape, applyPreserveFromSource } from './merge.js';
export type { MergeToTemplateOptions } from './merge.js';
export { pruneToTemplateShape } from './prune.js';
export type { PruneToTemplateOptions } from './prune.js';
