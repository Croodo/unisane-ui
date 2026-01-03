// ─── FINANCIAL TRANSACTION TYPES ─────────────────────────────────────────────

export type TransactionStatus = "completed" | "pending" | "failed" | "refunded";
export type TransactionCategory =
  | "Revenue"
  | "Operations"
  | "Technology"
  | "Services"
  | "Marketing"
  | "Travel"
  | "Insurance"
  | "Assets"
  | "Payroll"
  | "Utilities";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: TransactionCategory;
  amount: number;
  status: TransactionStatus;
  account: string;
  reference: string;
  notes: string;
}
