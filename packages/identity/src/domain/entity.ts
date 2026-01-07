import type { EntitySchema } from '@unisane/kernel';

export const UserSchema: EntitySchema = {
  collection: 'users',
  schema: {
    _id: 'string',
    email: 'string',
    displayName: { type: 'string', nullable: true },
    imageUrl: { type: 'string', nullable: true },
    username: { type: 'string', nullable: true },
    firstName: { type: 'string', nullable: true },
    lastName: { type: 'string', nullable: true },
    phone: { type: 'string', nullable: true },
    locale: { type: 'string', nullable: true },
    timezone: { type: 'string', nullable: true },
    globalRole: { type: { type: 'enum', ref: 'GlobalRole' }, nullable: true },
    authUserId: { type: 'string', nullable: true },
    createdAt: 'date',
    updatedAt: 'date',
    deletedAt: { type: 'date', nullable: true },
  },
};
