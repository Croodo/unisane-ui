export function getPublicCurrency(): string {
  return (process.env.NEXT_PUBLIC_BILLING_CURRENCY || 'USD').toUpperCase();
}

export function formatCurrency(amountMajor: number, currency = getPublicCurrency()): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amountMajor);
  } catch {
    // Fallback if currency code is invalid in runtime
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amountMajor);
  }
}

