import {
  defaultComparePair,
  versionsNewerThan,
  versionsOlderThan,
} from '@/features/compare/releases';
import { sortVersionsDesc } from '@/features/catalog/semver';
import { useEffect, useMemo, useState } from 'react';

type UseCompareSelectionOptions = {
  versions: string[];
  fromParam: string | null;
  toParam: string | null;
  onSyncUrl: (from: string, to: string) => void;
};

export function useCompareSelection({
  versions,
  fromParam,
  toParam,
  onSyncUrl,
}: UseCompareSelectionOptions) {
  const sorted = useMemo(() => sortVersionsDesc(versions), [versions]);
  const defaultPair = defaultComparePair(sorted);

  const [fromVersion, setFromVersion] = useState(() => {
    if (
      fromParam &&
      toParam &&
      fromParam !== toParam &&
      versions.includes(fromParam) &&
      versions.includes(toParam)
    ) {
      return fromParam;
    }
    return defaultPair?.from ?? sorted[0] ?? '';
  });

  const [toVersion, setToVersion] = useState(() => {
    if (
      fromParam &&
      toParam &&
      fromParam !== toParam &&
      versions.includes(fromParam) &&
      versions.includes(toParam)
    ) {
      return toParam;
    }
    return defaultPair?.to ?? sorted[0] ?? '';
  });

  // Sync URL → state without re-ordering (swap must not bounce back)
  useEffect(() => {
    if (
      !fromParam ||
      !toParam ||
      fromParam === toParam ||
      !versions.includes(fromParam) ||
      !versions.includes(toParam)
    ) {
      return;
    }
    setFromVersion(fromParam);
    setToVersion(toParam);
  }, [fromParam, toParam, versions]);

  const fromOptions = useMemo(
    () => sorted.filter((v) => v !== toVersion),
    [sorted, toVersion],
  );

  const toOptions = useMemo(
    () => sorted.filter((v) => v !== fromVersion),
    [sorted, fromVersion],
  );

  const setFrom = (from: string) => {
    const validTo = versionsNewerThan(sorted, from);
    const nextTo =
      from === toVersion
        ? validTo[0] ?? sorted.find((v) => v !== from) ?? from
        : validTo.includes(toVersion)
          ? toVersion
          : validTo[0] ?? toVersion;
    setFromVersion(from);
    setToVersion(nextTo);
    onSyncUrl(from, nextTo);
  };

  const setTo = (to: string) => {
    const validFrom = versionsOlderThan(sorted, to);
    const nextFrom =
      to === fromVersion
        ? validFrom[0] ?? sorted.find((v) => v !== to) ?? to
        : validFrom.includes(fromVersion)
          ? fromVersion
          : validFrom[0] ?? fromVersion;
    setFromVersion(nextFrom);
    setToVersion(to);
    onSyncUrl(nextFrom, to);
  };

  const swap = () => {
    const nextFrom = toVersion;
    const nextTo = fromVersion;
    setFromVersion(nextFrom);
    setToVersion(nextTo);
    onSyncUrl(nextFrom, nextTo);
  };

  return {
    sorted,
    fromVersion,
    toVersion,
    fromOptions,
    toOptions,
    setFrom,
    setTo,
    swap,
    isValidPair: Boolean(fromVersion && toVersion && fromVersion !== toVersion),
  };
}
