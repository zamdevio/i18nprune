export { splitPath, getAtPath, setAtPath, deleteAtPath } from '@/core/json/path/index.js';
export type { PathSegment } from '@/types/core/json/path.js';
export { deepClone } from '@/core/json/clone/index.js';
export { collectStringLeaves } from '@/core/json/leaves/index.js';
export { pruneToTemplateShape } from '@/core/json/prune/index.js';
export { mergeToTemplateShape, isPreservePath, applyPreserveFromSource } from '@/core/json/merge/index.js';
