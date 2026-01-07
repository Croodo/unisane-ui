# Unisane Handbook

Complete documentation for the Unisane platform and UI design system.

---

## Documentation Structure

```
handbook/
├── architecture/           # Platform architecture (SaasKit, modules, etc.)
│   ├── README.md           # Overview
│   ├── ARCHITECTURE.md     # Full specification (authoritative)
│   └── QUICK-REFERENCE.md  # Cheat sheet
│
├── design-system/          # UI component library
│   ├── README.md           # Design system overview
│   ├── 01-getting-started.md
│   ├── 02-utilities.md
│   ├── ... (16 component docs)
│   └── 16-pagination-rating.md
│
└── guides/                 # How-to guides
    └── quick-start.md      # UI library quick start
```

---

## Quick Navigation

### Platform Architecture

Building SaasKit or working with business modules?

| Document | Description |
|----------|-------------|
| [Architecture Overview](./architecture/README.md) | Platform architecture summary |
| [Full Specification](./architecture/ARCHITECTURE.md) | Complete architecture (authoritative) |
| [Quick Reference](./architecture/QUICK-REFERENCE.md) | Patterns cheat sheet |

### Design System (UI)

Building with Unisane UI components?

| Document | Description |
|----------|-------------|
| [Design System](./design-system/README.md) | Component library overview |
| [Getting Started](./design-system/01-getting-started.md) | Setup and tokens |
| [Components](./design-system/) | All 61+ components |

### Guides

| Guide | Description |
|-------|-------------|
| [Quick Start](./guides/quick-start.md) | Install and use UI components |

---

## What is Unisane?

Unisane is a platform for building SaaS products:

1. **UI Library** (`@unisane/ui`) - Material 3 components, shadcn-style
2. **SaasKit** - Full SaaS starter with auth, billing, tenants, etc.
3. **Modules** - Reusable business logic packages

### Target Users

- **Frontend devs**: Use `@unisane/ui` for Material 3 components
- **Full-stack devs**: Use SaasKit to build complete SaaS apps
- **Teams**: Customize and extend for specific needs

---

## Key Concepts

### For UI Development

```tsx
// Install components
npx @unisane/cli init
npx @unisane/cli add button dialog

// Use components
import { Button } from "@/components/ui/button";

<Button variant="filled">Click me</Button>
```

### For Platform Development

```typescript
// Business modules follow clean architecture
import { subscribe } from '@unisane/billing';
import { ctx, events } from '@unisane/kernel';

// All operations are tenant-scoped via context
const subscription = await subscribe({ planId: 'pro' });

// Events for async side effects
await events.emit('billing.subscription.created', { ... });
```

---

## Document Status

| Section | Status | Last Updated |
|---------|--------|--------------|
| Architecture | Authoritative | 2025-01-06 |
| Design System | Complete | 2025-12-27 |
| Guides | Active | 2025-12-27 |

---

**Maintainer:** Unisane Team
**Version:** 2.0
