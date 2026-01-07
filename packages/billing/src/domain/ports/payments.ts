import type { PaymentListPage, PaymentDetail } from '../types';
import type { BillingProvider } from '@unisane/kernel';
import type { PaymentStatus } from '@unisane/kernel';

export interface PaymentsRepo {
  listPage(args: { tenantId: string; cursor?: string; limit: number }): Promise<PaymentListPage>;
  findByProviderPaymentId(args: { tenantId: string; providerPaymentId: string }): Promise<PaymentDetail | null>;
  markRefunded(id: string): Promise<void>;
  upsertByProviderId(args: {
    tenantId: string;
    provider: BillingProvider;
    providerPaymentId: string;
    amount?: number;
    currency?: string;
    status: PaymentStatus;
    capturedAt?: Date | null;
  }): Promise<void>;
  listByProviderId(provider: BillingProvider): Promise<Array<{ tenantId: string; providerPaymentId: string }>>;
}
