import React from "react";
import { AlertTriangle } from "lucide-react";

type BreakingBannerProps = { count: number };

export default function BreakingBanner({ count }: BreakingBannerProps) {
  if (!count || count === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
      <p className="text-sm font-medium text-destructive">
        This release contains {count} breaking change{count > 1 ? "s" : ""}. Review the breaking changes section before upgrading.
      </p>
    </div>
  );
}
