# Pro/OSS Feature Markers

This document describes the marker system used to differentiate Pro and OSS features in the Unisane codebase.

## Overview

Unisane uses code markers to identify Pro-only features. When building the OSS version of a starter, these markers are processed to remove Pro features.

## Marker Types

### 1. File-Level Marker

Use when an entire file is Pro-only:

```typescript
/**
 * @pro-only
 *
 * Advanced analytics dashboard with AI insights.
 */

export function AdvancedAnalytics() {
  // ...
}
```

**Effect:** The entire file is excluded from OSS builds.

### 2. Block-Level Marker

Use for sections of code within a file:

```typescript
export function Dashboard() {
  const basicMetrics = useBasicMetrics();

  /* @pro-only:start */
  const advancedMetrics = useAdvancedMetrics();
  const aiInsights = useAIInsights();
  /* @pro-only:end */

  return (
    <div>
      <BasicMetrics data={basicMetrics} />
      {/* @pro-only:start */}
      <AdvancedMetrics data={advancedMetrics} />
      <AIInsights data={aiInsights} />
      {/* @pro-only:end */}
    </div>
  );
}
```

**Effect:** The block is replaced with `/* [PRO feature removed] */` in OSS builds.

### 3. Line-Level Marker

Use for single lines:

```typescript
import { basicAuth } from '@unisane/auth';
import { sso } from '@unisane/sso'; // @pro-only

export const authOptions = {
  providers: [
    basicAuth(),
    sso(), // @pro-only
  ],
};
```

**Effect:** The line is replaced with `// [PRO feature removed]` in OSS builds.

## Pro Packages

The following packages are considered Pro-only and are not included in OSS builds:

| Package | Description |
|---------|-------------|
| `@unisane/ai` | AI/LLM integration |
| `@unisane/credits` | Usage credits system |
| `@unisane/analytics` | Advanced analytics |
| `@unisane/sso` | Enterprise SSO |
| `@unisane/pdf` | PDF generation |
| `@unisane/import-export` | Bulk data import/export |

## Build Commands

```bash
# Build Pro starter (includes all features)
pnpm build:starter

# Build OSS starter (Pro features removed)
pnpm build:starter:oss

# Verify build (check for marker issues)
pnpm verify:build
```

## Guidelines

### When to Use Markers

1. **Use file-level** for entire modules that are Pro-only
2. **Use block-level** for feature sections within shared files
3. **Use line-level** for single imports or config lines

### Best Practices

1. Keep Pro features isolated when possible (prefer file-level)
2. Ensure OSS code is functional without Pro features
3. Don't nest Pro markers (use single block instead)
4. Test both Pro and OSS builds regularly

### Import Considerations

When using Pro packages, always mark the import:

```typescript
// Good: Import is marked
import { aiGenerate } from '@unisane/ai'; // @pro-only

// Bad: Import not marked (will cause build error in OSS)
import { aiGenerate } from '@unisane/ai';
```

## Verification

The `verify:build` command checks for:

1. Unmarked imports from Pro packages
2. Unclosed block markers
3. Pro marker usage in OSS-only files

Run verification before committing:

```bash
pnpm verify:build
```

## Example: Adding a Pro Feature

1. **Create the feature file:**

```typescript
// src/features/ai-assistant.tsx
/**
 * @pro-only
 */
export function AIAssistant() {
  // Pro feature implementation
}
```

2. **Add conditional export:**

```typescript
// src/features/index.ts
export * from './basic-features';

/* @pro-only:start */
export * from './ai-assistant';
/* @pro-only:end */
```

3. **Use in component:**

```typescript
// src/components/dashboard.tsx
import { BasicWidget } from '@/features';
import { AIAssistant } from '@/features'; // @pro-only

export function Dashboard() {
  return (
    <div>
      <BasicWidget />
      {/* @pro-only:start */}
      <AIAssistant />
      {/* @pro-only:end */}
    </div>
  );
}
```

4. **Verify:**

```bash
pnpm verify:build
pnpm build:starter:oss
```
