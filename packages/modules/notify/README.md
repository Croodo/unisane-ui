# @unisane/notify

Multi-channel notifications: email, in-app, SMS, push.

## Layer

5 - Features

## Features

- Email sending via Resend or SES
- In-app notifications with real-time pub/sub
- User notification preferences per category
- Email suppression list (bounces/complaints)
- Outbox pattern for reliable delivery

## Architecture Compliance

| Pattern | Status | Notes |
|---------|--------|-------|
| `selectRepo()` | ✅ | Used in repository facade |
| `getTenantId()` | ✅ | Used in in-app and prefs services |
| `getUserId()` | ✅ | Used in in-app and prefs services |
| `tenantFilter()` | 🔒 | N/A - explicit user+tenant scoping |
| Keys builder | ✅ | `notifyKeys` in domain/keys.ts |

## Usage

```typescript
import {
  sendEmail,
  enqueueEmail,
  sendInapp,
  listInapp,
  markRead,
  getUnreadCount,
  getPrefs,
  setPrefs,
  addSuppression,
} from "@unisane/notify";

// Send email directly
await sendEmail({
  to: { email: "user@example.com" },
  template: "welcome",
  props: { name: "John" },
});

// Queue email for reliable delivery
await enqueueEmail({
  tenantId,
  body: {
    to: { email: "user@example.com" },
    template: "invoice",
    props: { amount: 100 },
  },
});

// Send in-app notification (uses context)
await sendInapp({
  targetUserId: userId,
  title: "New message",
  body: "You have a new message from Alice",
  category: "messages",
});

// List in-app notifications (uses context)
const { items, nextCursor } = await listInapp({ limit: 20 });

// Mark notification as read
await markRead({ id: notificationId });

// Get unread count
const { count } = await getUnreadCount();

// User preferences
const prefs = await getPrefs();
await setPrefs({ categories: { marketing: false, updates: true } });

// Suppression (bounces/complaints)
await addSuppression({ email: "bounced@example.com", reason: "hard_bounce" });
```

## Channels

| Channel | Status | Provider |
|---------|--------|----------|
| Email | ✅ | Resend, SES |
| In-app | ✅ | MongoDB + Redis pub/sub |
| SMS | 🚧 | Planned |
| Push | 🚧 | Planned |

## Exports

- `sendEmail` - Send email directly
- `enqueueEmail` - Queue email for reliable delivery
- `sendInapp` - Send in-app notification
- `listInapp` - List user's in-app notifications
- `markRead` - Mark notification as read
- `markAllSeen` - Mark all notifications as seen
- `getUnreadCount` - Get unread notification count
- `deleteNotification` - Delete a notification
- `getPrefs` / `setPrefs` - User notification preferences
- `addSuppression` / `isSuppressed` - Email suppression management
- `notifyKeys` - Cache key builder
- `NOTIFY_EVENTS` - Event constants
- `NOTIFY_CHANNELS` - Channel type constants
