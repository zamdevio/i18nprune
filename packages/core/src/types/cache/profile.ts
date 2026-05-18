/** Named cache presets; resolved via {@link resolveCacheConfig}. */
export type CacheProfileId = 'safe' | 'balanced' | 'fast';

export type CacheProfileDefaults = {
  rebuild: 'partial' | 'full';
  fullRescanThresholdPercent: number;
  mode: 'readWrite' | 'readOnly';
};
