
export type SortField = { key: string; order: 1 | -1 };

export type SeekPageResult<T> = {
  items: T[];
  nextCursor?: string;
  prevCursor?: string;
};

export type SeekPageOptions<T> = {
  limit: number;
  cursor?: string | null;
  sortVec: SortField[];
  baseFilter?: Record<string, unknown>; // This might need to be generic or adapter-specific later
  projection?: Record<string, 0 | 1>;
};
