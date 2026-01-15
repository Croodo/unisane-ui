import type { PaymentListPage, PaymentDetail } from '../types';
import type { BillingProvider } from '@unisane/kernel';
import type { PaymentStatus } from '@unisane/kernel';

export interface PaymentsRepo {
  listPage(args: { scopeId: string; cursor?: string; limit: number }): Promise<PaymentListPage>;
  findByProviderPaymentId(args: { scopeId: string; providerPaymentId: string }): Promise<PaymentDetail | null>;
  markRefunded(id: string): Promise<void>;
  upsertByProviderId(args: {
    scopeId: string;
    provider: BillingProvider;
    providerPaymentId: string;
    amount?: number;
    currency?: string;
    status: PaymentStatus;
    capturedAt?: Date | null;
  }): Promise<void>;
  listByProviderId(provider: BillingProvider): Promise<Array<{ scopeId: string; providerPaymentId: string }>>;
}
