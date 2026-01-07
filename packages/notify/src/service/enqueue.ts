import { OutboxService } from '@unisane/kernel';
import type { z } from 'zod';

import type { EnqueueEmailArgs } from "../domain/types";
export type { EnqueueEmailArgs };

export async function enqueueEmail(args: EnqueueEmailArgs) {
  const payload = {
    to: args.body.to,
    template: args.body.template,
    props: args.body.props ?? {},
    ...(args.body.locale ? { locale: args.body.locale } : {}),
  };
  const res = await OutboxService.enqueue({ tenantId: args.tenantId, kind: 'email', payload });
  return { id: res.id } as const;
}
