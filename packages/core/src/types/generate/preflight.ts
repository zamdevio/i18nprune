export type GenerateTargetPreflightStatus = 'proceed' | 'fully_complete' | 'partial';

export type GenerateTargetPreflight = {
  status: GenerateTargetPreflightStatus;
  missingSegmentPaths: string[];
  missingKeyPaths: string[];
};
