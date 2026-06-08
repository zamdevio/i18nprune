import type { TemplateHole, TemplateHolePartition } from '../../types/extractor/template/index.js';

const SIMPLE_IDENT = /^[A-Za-z_$][\w$]*$/;

/**
 * Classify each `${…}` hole in a template inner as const-resolved (simple ident in `constMap`)
 * or runtime (unknown ident, member access, literal, compound expression).
 */
export function partitionTemplateHoles(
  inner: string,
  constMap: Record<string, string>,
): TemplateHolePartition {
  const holes: TemplateHole[] = [];
  const interpRe = /\$\{([^}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = interpRe.exec(inner)) !== null) {
    const expr = match[1]!.trim();
    const ident = SIMPLE_IDENT.exec(expr)?.[0];
    if (ident && Object.prototype.hasOwnProperty.call(constMap, ident)) {
      holes.push({
        kind: 'const_resolved',
        expr,
        identifier: ident,
        value: constMap[ident]!,
      });
      continue;
    }
    holes.push({ kind: 'runtime', expr });
  }

  const constResolved: TemplateHolePartition['constResolved'] = [];
  const runtime: TemplateHolePartition['runtime'] = [];
  for (const hole of holes) {
    if (hole.kind === 'const_resolved') constResolved.push(hole);
    else runtime.push(hole);
  }

  return { holes, constResolved, runtime };
}
