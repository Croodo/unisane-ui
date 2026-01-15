// Vendor-agnostic ID type (currently string)
export type DocumentId = string;

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
  // Mongo-compatibility mapping (generic operators)
  $eq?: T;
  $ne?: T;
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
  $in?: T[];
  $nin?: T[];
  $regex?: string;
  $options?: string;
};

export type FilterSpec<T> = {
  [K in keyof T]?: T[K] | FilterOp<T[K]>;
};

// Application-level Filter alias (preferred over provider specific types)
export type Filter<T> = FilterSpec<T>;
