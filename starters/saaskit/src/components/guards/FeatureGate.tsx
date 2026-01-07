"use client";

type FeatureGateProps = {
  flag: string;
  flags: Record<string, boolean>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function FeatureGate({
  flag,
  flags,
  children,
  fallback = null,
}: FeatureGateProps) {
  const isEnabled = flags[flag] ?? false;

  if (!isEnabled) return fallback;
  return children;
}
