import type { InitPresetId } from '../../types/init/index.js';
import type { InitPresetScore, InitProjectSignals, InitScoreFactor } from '../../types/init/index.js';
import { INIT_PRESET_IDS } from '../presets/fields.js';
import { initPackageDeclares } from './packageJson.js';

function sumContributions(factors: InitScoreFactor[]): number {
  let s = 0;
  for (const f of factors) s += f.contribution;
  return s;
}

function normalizeConfidence(score: number): number {
  if (!Number.isFinite(score) || score <= 0) return 0;
  return Math.min(1, score);
}

function buildFactors(preset: InitPresetId, signals: InitProjectSignals): InitScoreFactor[] {
  const pkg = signals.packageJson;
  const { topology } = signals;
  const factors: InitScoreFactor[] = [];

  if (preset === 'generic') {
    factors.push({
      id: 'baseline.generic',
      contribution: 0.12,
      detail: 'Always-available neutral starter',
    });
  }

  if (preset === 'next-intl') {
    if (initPackageDeclares(pkg, 'next-intl')) {
      factors.push({
        id: 'npm.next-intl',
        contribution: 0.48,
        detail: '`next-intl` declared in package.json',
      });
    }
    if (topology.localeRoots.includes('messages')) {
      factors.push({
        id: 'dir.messages',
        contribution: 0.28,
        detail: '`messages/` directory present',
      });
    }
    if (topology.nextConfigPresent && initPackageDeclares(pkg, 'next')) {
      factors.push({
        id: 'conv.next_app',
        contribution: 0.12,
        detail: '`next` dependency and Next config file present',
      });
    }
  }

  if (preset === 'next-i18next') {
    if (initPackageDeclares(pkg, 'next-i18next')) {
      factors.push({
        id: 'npm.next-i18next',
        contribution: 0.46,
        detail: '`next-i18next` declared in package.json',
      });
    }
    if (topology.localeRoots.includes('public/locales')) {
      factors.push({
        id: 'dir.public_locales',
        contribution: 0.26,
        detail: '`public/locales/` directory present',
      });
    }
    if (topology.nextConfigPresent && initPackageDeclares(pkg, 'next')) {
      factors.push({
        id: 'conv.next_app',
        contribution: 0.1,
        detail: '`next` dependency and Next config file present',
      });
    }
  }

  if (preset === 'i18next') {
    if (initPackageDeclares(pkg, 'i18next')) {
      factors.push({
        id: 'npm.i18next',
        contribution: 0.42,
        detail: '`i18next` declared in package.json',
      });
    }
    if (initPackageDeclares(pkg, 'react-i18next')) {
      factors.push({
        id: 'npm.react-i18next',
        contribution: 0.22,
        detail: '`react-i18next` declared in package.json',
      });
    }
    if (topology.localeRoots.includes('locales') || topology.localeRoots.includes('public/locales')) {
      factors.push({
        id: 'dir.locales_family',
        contribution: 0.2,
        detail: '`locales/` or `public/locales/` directory present',
      });
    }
  }

  if (preset === 'react-intl') {
    if (initPackageDeclares(pkg, 'react-intl')) {
      factors.push({
        id: 'npm.react-intl',
        contribution: 0.44,
        detail: '`react-intl` declared in package.json',
      });
    }
    if (initPackageDeclares(pkg, '@formatjs/intl')) {
      factors.push({
        id: 'npm.formatjs_intl',
        contribution: 0.18,
        detail: '`@formatjs/intl` declared in package.json',
      });
    }
    if (topology.localeRoots.includes('lang') || topology.localeRoots.includes('locales')) {
      factors.push({
        id: 'dir.lang_or_locales',
        contribution: 0.12,
        detail: '`lang/` or `locales/` directory present',
      });
    }
  }

  if (preset === 'lingui') {
    if (initPackageDeclares(pkg, '@lingui/core') || initPackageDeclares(pkg, '@lingui/react')) {
      factors.push({
        id: 'npm.lingui',
        contribution: 0.46,
        detail: '`@lingui/core` or `@lingui/react` declared in package.json',
      });
    }
    if (topology.localeRoots.includes('locales')) {
      factors.push({
        id: 'dir.locales',
        contribution: 0.14,
        detail: '`locales/` directory present',
      });
    }
  }

  return factors;
}

const FRAMEWORK_PRESETS: InitPresetId[] = ['next-intl', 'next-i18next', 'i18next'];

function applyConflictDampingInPlace(rows: InitPresetScore[]): void {
  for (const r of rows) {
    r.score = r.rawScore;
  }
  const strong = FRAMEWORK_PRESETS.map((id) => rows.find((x) => x.preset === id)).filter(
    (x): x is InitPresetScore => Boolean(x && x.rawScore >= 0.32),
  );
  if (strong.length >= 2) {
    const factor = 0.72;
    for (const r of strong) {
      r.score = r.rawScore * factor;
    }
  }
}

/**
 * Score curated presets from **`InitProjectSignals`** using weighted, explainable factors.
 *
 * @remarks Pure — deterministic; callers handle ambiguity / host UX.
 */
export function scoreInitPresets(signals: InitProjectSignals): InitPresetScore[] {
  const rows: InitPresetScore[] = INIT_PRESET_IDS.map((preset) => {
    const factors = buildFactors(preset, signals);
    const rawScore = sumContributions(factors);
    return { preset, rawScore, score: 0, confidence: 0, factors };
  });
  applyConflictDampingInPlace(rows);
  for (const r of rows) {
    r.confidence = normalizeConfidence(r.score);
  }
  rows.sort((a, b) => b.score - a.score);
  return rows;
}

/** Top preset id after **`scoreInitPresets`** (array sorted descending by score). */
export function pickTopInitPreset(scores: InitPresetScore[]): InitPresetId {
  return scores[0]?.preset ?? 'generic';
}

/**
 * Whether auto-selection should refuse to pick a single preset without host confirmation.
 *
 * @param scores — sorted descending (as returned by **`scoreInitPresets`**).
 */
export function isInitAutoAmbiguous(scores: InitPresetScore[]): boolean {
  if (scores.length < 2) return false;
  const [a, b] = scores;
  if (a.preset === 'generic' && a.score <= 0.2 && b.score < 0.08) {
    return false;
  }
  if (a.score < 0.28) return true;
  if (a.score - b.score < 0.1) return true;
  return false;
}
