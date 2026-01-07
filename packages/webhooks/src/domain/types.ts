import type { WebhookDirection, WebhookEventStatus, WebhookProvider } from '@unisane/kernel';

export type WebhookEventListItem = {
  id: string;
  direction: WebhookDirection;
  status: WebhookEventStatus;
  httpStatus: number | null;
  target: string | null;
  provider: WebhookProvider | null;
  createdAt?: Date;
};

export type WebhookEventListPage = {
  items: WebhookEventListItem[];
  nextCursor?: string;
  prevCursor?: string;
};

export type WebhookEventDetail = {
  id: string;
  tenantId: string;
  direction: WebhookDirection;
  status: WebhookEventStatus;
  target: string | null;
  payload: unknown;
};
