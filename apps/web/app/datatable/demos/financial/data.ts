import type { Transaction, TransactionCategory, TransactionStatus } from "./types";

// ─── DATA GENERATION ─────────────────────────────────────────────────────────

const categories: TransactionCategory[] = [
  "Revenue",
  "Operations",
  "Technology",
  "Services",
  "Marketing",
  "Travel",
  "Insurance",
  "Assets",
  "Payroll",
  "Utilities",
];

const statuses: TransactionStatus[] = ["completed", "pending", "failed", "refunded"];

const accounts = [
  "Business Checking",
  "Business Credit",
  "Savings Account",
  "Petty Cash",
  "PayPal Business",
];

const revenueDescriptions = [
  "Client Payment - Acme Corp",
  "Client Payment - TechStart Inc",
  "Consulting Revenue",
  "Product Sales",
  "Subscription Revenue",
  "Service Fee Income",
  "Licensing Revenue",
  "Commission Income",
];

const expenseDescriptions: Record<Exclude<TransactionCategory, "Revenue">, string[]> = {
  Operations: ["Office Supplies", "Cleaning Services", "Office Rent", "Maintenance"],
  Technology: ["Software Subscription", "Cloud Hosting", "Hardware Purchase", "IT Support"],
  Services: ["Contractor Payment", "Legal Services", "Accounting Services", "HR Services"],
  Marketing: ["Marketing Campaign", "Social Media Ads", "Trade Show", "Print Materials"],
  Travel: ["Travel Expenses", "Hotel Accommodation", "Flight Tickets", "Car Rental"],
  Insurance: ["Insurance Premium", "Liability Insurance", "Health Insurance"],
  Assets: ["Equipment Purchase", "Furniture", "Vehicle Purchase"],
  Payroll: ["Salary Payment", "Bonus Payment", "Payroll Tax"],
  Utilities: ["Electricity Bill", "Internet Service", "Phone Bill", "Water Bill"],
};

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split("T")[0]!;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function generateReference(): string {
  const prefix = ["TXN", "INV", "PAY", "REF"][Math.floor(Math.random() * 4)]!;
  const num = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}-${num}`;
}

export function generateTransactions(count: number): Transaction[] {
  const transactions: Transaction[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  for (let i = 0; i < count; i++) {
    const category = randomElement(categories);
    const isRevenue = category === "Revenue";

    let description: string;
    if (isRevenue) {
      description = randomElement(revenueDescriptions);
    } else {
      description = randomElement(expenseDescriptions[category]);
    }

    // Revenue is positive, expenses are negative
    let amount: number;
    if (isRevenue) {
      amount = Math.round((Math.random() * 15000 + 1000) * 100) / 100;
    } else {
      amount = -Math.round((Math.random() * 5000 + 50) * 100) / 100;
    }

    // Most transactions are completed
    const statusRandom = Math.random();
    let status: TransactionStatus;
    if (statusRandom < 0.75) {
      status = "completed";
    } else if (statusRandom < 0.90) {
      status = "pending";
    } else if (statusRandom < 0.97) {
      status = "failed";
    } else {
      status = "refunded";
    }

    transactions.push({
      id: `txn-${String(i + 1).padStart(4, "0")}`,
      date: randomDate(startDate, endDate),
      description,
      category,
      amount,
      status,
      account: randomElement(accounts),
      reference: generateReference(),
      notes: Math.random() > 0.7 ? "Flagged for review" : "",
    });
  }

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return transactions;
}
