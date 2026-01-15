"use client";

import { useState, useMemo, useCallback } from "react";

export type UseFormCardOptions<T> = {
  serverValue: T;
  serverVersion?: number | undefined;
};

export function useFormCard<T extends Record<string, unknown>>({
  serverValue,
  serverVersion,
}: UseFormCardOptions<T>) {
  const [localOverrides, setLocalOverrides] = useState<Partial<T>>({});
  const [savedVersion, setSavedVersion] = useState<number | undefined>(
    undefined
  );

  const value = useMemo(
    () => ({ ...serverValue, ...localOverrides }),
    [serverValue, localOverrides]
  );

  const hasChanges = useMemo(() => {
    return Object.keys(localOverrides).some(
      (key) =>
        JSON.stringify(localOverrides[key as keyof T]) !==
        JSON.stringify(serverValue[key as keyof T])
    );
  }, [localOverrides, serverValue]);

  const version = savedVersion ?? serverVersion;

  const setValue = useCallback(<K extends keyof T>(field: K, val: T[K]) => {
    setLocalOverrides((prev) => ({ ...prev, [field]: val }));
  }, []);

  const reset = useCallback(() => {
    setLocalOverrides({});
  }, []);

  const markSaved = useCallback((newVersion?: number) => {
    setLocalOverrides({});
    if (newVersion !== undefined) {
      setSavedVersion(newVersion);
    }
  }, []);

  return {
    value,
    setValue,
    hasChanges,
    version,
    reset,
    markSaved,
  };
}
