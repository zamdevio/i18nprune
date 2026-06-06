import fs from 'node:fs';
import type { ExportCommit } from './parse.js';
import { PHASES_CONFIG } from './paths.js';

export type PhaseColor = 'teal' | 'gray' | 'purple' | 'coral';

export interface PhaseConfig {
  week: string;
  label: string;
  theme: string;
  color: PhaseColor;
  shipped: string[];
}

export interface PhaseOutput extends PhaseConfig {
  commits: number;
}

export function loadPhaseConfig(): PhaseConfig[] {
  const raw = fs.readFileSync(PHASES_CONFIG, 'utf-8');
  return JSON.parse(raw) as PhaseConfig[];
}

export function findUnconfiguredWeeks(
  config: PhaseConfig[],
  commits: ExportCommit[],
): string[] {
  const configured = new Set(config.map((phase) => phase.week));
  const weeksWithCommits = new Set(commits.map((commit) => commit.week));
  return [...weeksWithCommits]
    .filter((week) => !configured.has(week))
    .sort((a, b) => a.localeCompare(b));
}

export function findConfiguredWeeksWithoutCommits(
  config: PhaseConfig[],
  commits: ExportCommit[],
): string[] {
  const weeksWithCommits = new Set(commits.map((commit) => commit.week));
  return config
    .map((phase) => phase.week)
    .filter((week) => !weeksWithCommits.has(week))
    .sort((a, b) => a.localeCompare(b));
}

export function mergePhases(config: PhaseConfig[], commits: ExportCommit[]): PhaseOutput[] {
  const weekCounts = new Map<string, number>();
  for (const commit of commits) {
    weekCounts.set(commit.week, (weekCounts.get(commit.week) ?? 0) + 1);
  }

  const configuredWeeks = new Set(config.map((p) => p.week));
  const merged: PhaseOutput[] = config.map((phase) => ({
    ...phase,
    commits: weekCounts.get(phase.week) ?? 0,
  }));

  for (const [week, count] of weekCounts) {
    if (configuredWeeks.has(week)) continue;
    merged.push({
      week,
      label: week.replace('2026-', 'Week '),
      theme: 'Additional development activity',
      color: 'gray',
      shipped: [],
      commits: count,
    });
  }

  return merged.sort((a, b) => a.week.localeCompare(b.week));
}
