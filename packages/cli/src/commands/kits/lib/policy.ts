type Signal = {
  missingLiteralKeys?: number;
  dynamicKeySites?: number;
  sourceIdenticalLeaves?: number;
  issuesCount?: number;
};

export function evaluateKitsPolicy(signal: Signal, failOn: string[], maxDynamic?: number): string[] {
  const reasons: string[] = [];
  const failSet = new Set(failOn);

  if (maxDynamic !== undefined && (signal.dynamicKeySites ?? 0) > maxDynamic) {
    reasons.push(`dynamicKeySites(${signal.dynamicKeySites}) > maxDynamic(${maxDynamic})`);
  }
  if (failSet.has('missing') && (signal.missingLiteralKeys ?? 0) > 0) {
    reasons.push(`missingLiteralKeys=${signal.missingLiteralKeys}`);
  }
  if (failSet.has('dynamic') && (signal.dynamicKeySites ?? 0) > 0) {
    reasons.push(`dynamicKeySites=${signal.dynamicKeySites}`);
  }
  if (failSet.has('source-identical') && (signal.sourceIdenticalLeaves ?? 0) > 0) {
    reasons.push(`sourceIdenticalLeaves=${signal.sourceIdenticalLeaves}`);
  }
  if (failSet.has('issues') && (signal.issuesCount ?? 0) > 0) {
    reasons.push(`issuesCount=${signal.issuesCount}`);
  }

  return reasons;
}

export function parseFailOnList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
