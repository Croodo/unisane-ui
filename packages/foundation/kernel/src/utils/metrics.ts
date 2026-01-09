// Minimal metrics facade (no-op). Replace with StatsD/OTEL adapters later.
export const metrics = {
  inc: (_name: string, _labels?: Record<string, string | number>) => {},
  observe: (
    _name: string,
    _ms: number,
    _labels?: Record<string, string | number>
  ) => {},
};
