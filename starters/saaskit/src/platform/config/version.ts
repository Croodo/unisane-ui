export function bump(snapshotVersion: number | null | undefined): number {
  const cur = typeof snapshotVersion === 'number' && snapshotVersion >= 0 ? snapshotVersion : 0;
  return cur + 1;
}

export function isConflict(current: number, expected?: number): boolean {
  return expected !== undefined && current !== expected;
}

