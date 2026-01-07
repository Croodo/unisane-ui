type RangeValue = { min?: unknown; max?: unknown; start?: unknown; end?: unknown };

export const formatFilterValue = (val: unknown): string => {
  if (Array.isArray(val)) return val.join(", ");
  if (val && typeof val === "object") {
    const obj = val as RangeValue;
    if (obj.min !== undefined || obj.max !== undefined) {
      const min = obj.min !== "" && obj.min !== undefined ? String(obj.min) : "0";
      const max = obj.max !== "" && obj.max !== undefined ? String(obj.max) : "∞";
      return `${min} - ${max}`;
    }
    if (obj.start !== undefined || obj.end !== undefined) {
      const formatDate = (dateStr: string) => {
        if (!dateStr) return "Any";
        const [y, m, d] = String(dateStr).split("-").map(Number);
        if (!y || !m || !d || Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return String(dateStr);
        return new Date(y, m - 1, d).toLocaleDateString();
      };
      const start = formatDate(obj.start as string);
      const end = formatDate(obj.end as string);
      return `${start} - ${end}`;
    }
    return JSON.stringify(obj);
  }
  return String(val ?? "");
};
