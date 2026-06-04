import type { ReleaseRecordV1 } from '@/types';
import ReleaseCard from './card';

type ReleaseTimelineProps = {
  releases: ReleaseRecordV1[];
  showStream?: boolean;
};

export default function ReleaseTimeline({ releases, showStream = false }: ReleaseTimelineProps) {
  if (!releases || releases.length === 0) return null;

  return (
    <div className="space-y-4">
      {releases.map((release) => (
        <ReleaseCard
          key={`${release.stream}-${release.version}`}
          release={release}
          showStream={showStream}
        />
      ))}
    </div>
  );
}
