/** Mirror worker `PROJECT_LIMITS` for client-side zip handling. */
export const PROJECT_LIMITS = {
  maxZipBytes: 50 * 1024 * 1024,
  maxFiles: 15000,
  maxTextBytes: 60 * 1024 * 1024,
} as const;
