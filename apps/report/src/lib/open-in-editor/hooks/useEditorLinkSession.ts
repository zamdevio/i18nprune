import { useMemo } from 'react';
import { useOptionalReport } from '../../../context/report/hooks.js';
import { resolveGeneratorEnvironment } from '../generator/resolve.js';
import {
  evaluateEditorLinkPolicyFromPayload,
  policyForMissingEnvironment,
} from '../policy/evaluate.js';
import type { EditorLinkPolicy, GeneratorEnvironment, ViewerEnvironment } from '../types.js';
import { useViewerEnvironment } from './useViewerEnvironment.js';

export type EditorLinkSession = {
  policy: EditorLinkPolicy;
  generator: GeneratorEnvironment;
  viewer: ViewerEnvironment;
  cwd: string;
};

export function useEditorLinkSession(): EditorLinkSession {
  const doc = useOptionalReport();
  const viewer = useViewerEnvironment();

  return useMemo(() => {
    if (!doc) {
      return {
        policy: { allow: false, reason: 'missing-runtime-metadata' },
        generator: { family: 'unsupported' },
        viewer,
        cwd: '',
      };
    }

    const generator = resolveGeneratorEnvironment(doc.project.environment);
    const policy = doc.project.environment
      ? evaluateEditorLinkPolicyFromPayload({
          environment: doc.project.environment,
          cwd: doc.project.cwd,
          viewer,
        })
      : policyForMissingEnvironment(doc.project.cwd);

    return {
      policy,
      generator,
      viewer,
      cwd: doc.project.cwd,
    };
  }, [doc, viewer]);
}
