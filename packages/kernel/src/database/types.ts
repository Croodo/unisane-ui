export type FilterOp<T> = {
  eq?: T;
  neq?: T;
  in?: T[];
  nin?: T[];
  gt?: T;
  gte?: T;
  lt?: T;
  lte?: T;
  contains?: string; // For strings
  startsWith?: string; // For strings
  endsWith?: string; // For strings
};

export type FilterSpec<T> = {
  [K in keyof T]?: T[K] | FilterOp<T[K]>;
};
