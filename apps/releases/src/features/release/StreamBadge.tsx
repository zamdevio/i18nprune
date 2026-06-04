import React from "react";
import { STREAM_META } from '@/features/catalog/streams';
import type { StreamId } from '@/types';

type StreamBadgeProps = {
  stream: StreamId;
  size?: 'sm' | 'lg';
};

export default function StreamBadge({ stream, size = 'sm' }: StreamBadgeProps) {
  const meta = STREAM_META[stream];
  if (!meta) return null;

  const sizeClasses = size === "lg"
    ? "px-3 py-1 text-sm font-semibold"
    : "px-2 py-0.5 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center rounded-full ${sizeClasses} ${meta.bgClass} text-white`}
    >
      {meta.label}
    </span>
  );
}
