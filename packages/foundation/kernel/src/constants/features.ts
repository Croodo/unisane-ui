import { z } from 'zod';

// Canonical registry of metered feature keys
export const FEATURE = {
  AI_GENERATE: 'ai.generate',
  PDF_RENDER: 'pdf.render',
  API_CALL: 'api.call',
  STORAGE_GB: 'storage.gb',
  IMAGE_PROCESS: 'image.process',
} as const;

export type FeatureKey = (typeof FEATURE)[keyof typeof FEATURE];
export const FEATURES = Object.values(FEATURE) as FeatureKey[];
// Cast to tuple for Zod since it expects readonly tuple type
export const ZFeatureKey = z.enum(FEATURES as [FeatureKey, ...FeatureKey[]]);
