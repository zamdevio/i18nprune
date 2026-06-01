import type { InitPresetScore, InitProjectSignals } from '../initRun.js';

export type InitDetectResult = {
  signals: InitProjectSignals;
  scores: InitPresetScore[];
};
