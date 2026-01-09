# Unisane Roadmaps

Active development roadmaps and implementation plans for the Unisane platform.

---

## Quick Navigation

| Document | Focus | Status |
|----------|-------|--------|
| [MASTER-ROADMAP.md](./MASTER-ROADMAP.md) | Overall vision & phases | Active |
| [centralization-plan.md](./centralization-plan.md) | Architecture consolidation | Active |
| [server-table-state.md](./server-table-state.md) | DataTable patterns | Active |

---

## Reading Order

1. **Start here:** [MASTER-ROADMAP.md](./MASTER-ROADMAP.md) - Understand the overall direction
2. **Current work:** Check which phase is active in MASTER-ROADMAP
3. **Specific task:** Read the relevant detailed roadmap

---

## Document Purpose

### MASTER-ROADMAP.md

The single source of truth for:
- Overall vision and goals
- Phase ordering and priorities
- Decision log
- Success metrics
- Links to all other documents

**When to read:** Starting any significant work, understanding priorities.

### centralization-plan.md

Detailed plan for architecture consolidation:
- Schema organization fixes
- Admin config centralization
- Package consistency improvements
- Step-by-step migration checklist

**When to read:** Working on architecture improvements, fixing fragmentation.

### server-table-state.md

Implementation plan for DataTable patterns:
- Server-first vs client-first patterns
- SDK generator updates
- useServerTable hook
- Page persistence in URL

**When to read:** Working on admin pages, data tables, SDK generation.

---

## How to Use These Documents

### Before Starting Work

1. Check [implementation-status.md](../architecture/implementation-status.md) for current state
2. Read [MASTER-ROADMAP.md](./MASTER-ROADMAP.md) to understand priorities
3. Read the relevant detailed roadmap

### During Implementation

1. Follow the checklist in the relevant roadmap
2. Update checkboxes as you complete tasks
3. Note any issues or deviations in the roadmap

### After Completing Work

**Follow the [Phase Completion Protocol](./MASTER-ROADMAP.md#phase-completion-protocol):**

1. Update [implementation-status.md](../architecture/implementation-status.md) - change **Planned** → **Implemented**
2. Update MASTER-ROADMAP.md "Current State Summary" table
3. Mark tasks complete in the roadmap checklists
4. Update any affected architecture docs
5. Add to decision log if significant decisions were made
6. Refresh "Last Updated" dates on modified docs

---

## Related Documentation

### Architecture (How things work)

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) | Complete platform specification |
| [implementation-status.md](../architecture/implementation-status.md) | What's built vs planned |
| [platform-layer.md](../architecture/platform-layer.md) | Hexagonal architecture |
| [sdk-architecture.md](../architecture/sdk-architecture.md) | SDK generation patterns |
| [contracts-guide.md](../architecture/contracts-guide.md) | API contract patterns |

### Guides (How to do things)

| Document | Purpose |
|----------|---------|
| [module-development.md](../architecture/module-development.md) | Creating new modules |
| [testing.md](../architecture/testing.md) | Writing tests |
| [troubleshooting.md](../architecture/troubleshooting.md) | Debugging issues |

---

## Contributing

When adding new roadmaps:

1. Follow the existing document structure
2. Link from MASTER-ROADMAP.md
3. Add to this README
4. Include clear checklists
5. Reference related documents

---

**Last Updated:** 2026-01-09
