import { expandFunctionsWithBindings, scanImportBindings } from '../bindings/index.js';
import { buildConstStringMap } from '../constmap/build.js';
import { commentRangesForJsLikeText } from '../shared/jslikeTextRanges.js';
import { scanProjectSourceFiles } from '../shared/projectScan.js';
import { scanKeyObservations } from './scan.js';
import type { ScanProjectKeyObservationsInput } from '../../types/extractor/keySites/orchestrate.js';
import type { KeyObservation } from '../../types/extractor/keySites/index.js';

/** Project-wide key observation scan with per-file path metadata. */
export function scanProjectKeyObservations(input: ScanProjectKeyObservationsInput): KeyObservation[] {
  return scanProjectSourceFiles({
    srcRoot: input.srcRoot,
    cwd: input.cwd,
    runtime: input.runtime,
    path: input.path,
    readFile: input.readFile,
    listFiles: input.listFiles,
    exclude: input.exclude,
    scanFile: ({ text, displayPath }) => {
      const functions = expandFunctionsWithBindings(input.functions, scanImportBindings(text));
      const constMap = buildConstStringMap(text);
      const commentRanges = commentRangesForJsLikeText(text);
      const observations = scanKeyObservations(text, functions, constMap, {
        commentRanges,
      });
      return observations.map((obs) => ({
        ...obs,
        span: { ...obs.span, filePath: displayPath },
      }));
    },
  });
}
