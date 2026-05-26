import { generatorFamilyLabel } from '../generator/resolve.js';
import type { GeneratorRuntimeFamily, LinkPolicyReason } from '../types.js';

export function linkPolicyReasonMessage(
  reason: LinkPolicyReason,
  generatorFamily?: GeneratorRuntimeFamily,
): string {
  switch (reason) {
    case 'generator-environment-unsupported':
      return 'Editor links are not available for reports generated in the browser or cloud.';
    case 'viewer-environment-incompatible': {
      const gen =
        generatorFamily && generatorFamily !== 'unsupported'
          ? generatorFamilyLabel(generatorFamily)
          : 'another system';
      return `This report was generated on ${gen}. Open it on the same kind of system to use editor links, or copy the path.`;
    }
    case 'wsl-cross-host-unsupported':
      return 'WSL-generated reports cannot open files in an editor from this browser yet. Copy the path instead.';
    case 'synthetic-cwd':
      return 'This report does not include a real project directory on your machine. Copy the path shown in the table.';
    case 'mobile-browser':
      return 'Editor links are available on desktop with a mouse or trackpad.';
    case 'missing-runtime-metadata':
      return 'This report is missing environment metadata. Regenerate with i18nprune report to enable editor links.';
  }
}
