import type { PaymentsRepo } from '../domain/ports/payments';
import { mongoPaymentsRepo } from './payments.repository.mongo';
import { selectRepo } from '@unisane/kernel';

export const PaymentsRepository = selectRepo<PaymentsRepo>({ mongo: mongoPaymentsRepo });
