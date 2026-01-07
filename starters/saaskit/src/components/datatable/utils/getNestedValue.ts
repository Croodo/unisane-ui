export const getNestedValue = (obj: unknown, path: string): unknown => {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[part];
  }, obj);
};
