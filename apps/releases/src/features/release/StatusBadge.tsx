import { CheckCircle, AlertTriangle, Archive } from "lucide-react";

const STATUS_CONFIG = {
  stable: {
    label: "Stable",
    icon: CheckCircle,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  prerelease: {
    label: "Pre-release",
    icon: AlertTriangle,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  deprecated: {
    label: "Deprecated",
    icon: Archive,
    className: "bg-muted text-muted-foreground border-border",
  },
};

import type { ReleaseStatus } from '@/types';

type StatusBadgeProps = { status: ReleaseStatus };

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.stable;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
