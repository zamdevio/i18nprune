export const PROJECT_LIMITS = {
  // Raised limits for real-world projects while staying reasonable for local worker memory.
  maxZipBytes: 50 * 1024 * 1024, // 50MB
  maxFiles: 15000, // 15,000 files
  maxTextBytes: 60 * 1024 * 1024, // 60MB
  // -1 means "store full cached previews" (no truncation at upload time).
  maxCachedPreviewItems: -1,
} as const;
