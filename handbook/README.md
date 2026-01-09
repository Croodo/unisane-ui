# Unisane Handbook

Complete documentation for the Unisane platform and UI design system.

---

## Documentation Structure

```
handbook/
├── architecture/           # Platform architecture (SaasKit, modules, etc.)
│   ├── README.md           # Architecture index
│   ├── ARCHITECTURE.md     # Full specification (authoritative)
│   ├── implementation-status.md  # What's built vs planned
│   └── ...                 # 15+ detailed docs
│
├── roadmaps/               # Development roadmaps
│   ├── README.md           # Roadmaps index
│   ├── MASTER-ROADMAP.md   # Overall vision & phases
│   ├── centralization-plan.md  # Architecture consolidation
│   └── server-table-state.md   # DataTable patterns
│
├── design-system/          # UI component library
│   ├── README.md           # Design system overview
│   ├── 01-getting-started.md
│   └── ... (16 component docs)
│
└── guides/                 # How-to guides
    └── quick-start.md      # UI library quick start
```

---

## Quick Navigation

### Roadmaps (What to Build)

Planning work or understanding priorities?

| Document | Description |
|----------|-------------|
| [Master Roadmap](./roadmaps/MASTER-ROADMAP.md) | Overall vision, phases, priorities |
| [Centralization Plan](./roadmaps/centralization-plan.md) | Architecture consolidation tasks |
| [Server Table State](./roadmaps/server-table-state.md) | DataTable implementation plan |

### Platform Architecture (How Things Work)

Building SaasKit or working with business modules?

| Document | Description |
|----------|-------------|
| [Architecture Overview](./architecture/README.md) | Platform architecture index |
| [Full Specification](./architecture/ARCHITECTURE.md) | Complete architecture (authoritative) |
| [Implementation Status](./architecture/implementation-status.md) | What's built vs planned |
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
| Roadmaps | Active | 2026-01-09 |
| Architecture | Authoritative | 2026-01-09 |
| Design System | Complete | 2025-12-27 |
| Guides | Active | 2025-12-27 |

---

## Where to Start

| I want to... | Read this |
|--------------|-----------|
| Understand overall direction | [Master Roadmap](./roadmaps/MASTER-ROADMAP.md) |
| Check what's built vs planned | [Implementation Status](./architecture/implementation-status.md) |
| Understand the architecture | [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) |
| Work on architecture improvements | [Centralization Plan](./roadmaps/centralization-plan.md) |
| Work on DataTable pages | [Server Table State](./roadmaps/server-table-state.md) |
| Use UI components | [Design System](./design-system/README.md) |

---

**Maintainer:** Unisane Team
**Version:** 2.1
**Last Updated:** 2026-01-09
