# Unisane UI - Complete Implementation Plan

## Overview
Transform Unisane UI into a production-ready design system with shadcn-level developer experience while maintaining Material 3 compliance and superior customization capabilities.

---

## Phase 1: CLI Enhancement 🛠️

### 1.1 Registry System
**Goal:** Create a component registry like shadcn's for reliable component installation

**Tasks:**
- [ ] Create `registry/` directory structure in packages/ui
- [ ] Copy all components to registry maintaining folder structure
- [ ] Add metadata file (`registry.json`) with component info
- [ ] Update CLI to use registry instead of direct node_modules access

**Files to create:**
```
packages/ui/
├── registry/
│   ├── components/
│   ├── primitives/
│   ├── layout/
│   ├── lib/
│   └── registry.json
```

**registry.json structure:**
```json
{
  "button": {
    "name": "Button",
    "type": "component",
    "files": ["components/button.tsx"],
    "dependencies": ["ripple"],
    "registryDependencies": [],
    "description": "Material 3 button with 5 variants",
    "variants": ["filled", "tonal", "outlined", "text", "elevated"],
    "accessibility": true
  }
}
```

### 1.2 Theme Generation Command
**Goal:** Allow users to generate custom themes from a single brand color

**Command:**
```bash
npx @unisane/cli generate-theme --color="#FF5722"
```

**Tasks:**
- [ ] Add `generate-theme` command to CLI
- [ ] Create Material 3 tonal palette generator (using HCT algorithm)
- [ ] Generate complete ref.json from single color
- [ ] Output custom theme CSS file
- [ ] Update ThemeProvider with custom color tokens

**Algorithm:** Use Material Color Utilities library for proper M3 tonal palettes

### 1.3 Enhanced Doctor Command
**Goal:** Comprehensive project health check

**Checks:**
- [ ] Verify Tailwind v4 installation
- [ ] Check for required token files
- [ ] Validate component imports
- [ ] Test color contrast ratios (WCAG AA)
- [ ] Verify focus-visible styles
- [ ] Check for missing ARIA labels
- [ ] Test keyboard navigation

**Output:**
```
✅ Tailwind CSS v4 detected
✅ Token files present
⚠️  3 components missing ARIA labels
❌ Button contrast ratio: 3.2:1 (needs 4.5:1)
```

---

## Phase 2: Enhanced ThemeProvider 🎨

### 2.1 Dark Mode Support
**Current state:** Dark mode CSS exists but no runtime toggle

**Tasks:**
- [ ] Add `theme` state to ThemeProvider ("light" | "dark" | "system")
- [ ] Create `useColorScheme()` hook
- [ ] Add system preference detection
- [ ] Apply `.dark` class to `<html>` element
- [ ] Add persistence to localStorage
- [ ] Create ThemeSwitcher component

**Updated ThemeProvider API:**
```tsx
<ThemeProvider
  initialDensity="standard"
  initialTheme="system"
  initialRadius="standard"
>
```

**New hook:**
```tsx
const { theme, setTheme, resolvedTheme } = useColorScheme();
// theme: "light" | "dark" | "system"
// resolvedTheme: "light" | "dark" (actual applied theme)
```

### 2.2 Radius Theme Switcher
**Goal:** Runtime radius customization

**Tasks:**
- [ ] Add `radiusTheme` state ("sharp" | "standard" | "soft")
- [ ] Apply `data-radius` attribute to document
- [ ] Create RadiusSwitcher component
- [ ] Add to theme demo page

**Usage:**
```tsx
const { radiusTheme, setRadiusTheme } = useTheme();
setRadiusTheme("soft"); // Applies data-radius="soft"
```

### 2.3 Complete ThemeProvider
**File:** `packages/ui/src/layout/theme-provider.tsx`

**New features:**
```tsx
export interface ThemeConfig {
  density?: Density;
  theme?: "light" | "dark" | "system";
  radius?: "sharp" | "standard" | "soft";
  customColors?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function ThemeProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config?: ThemeConfig;
}) {
  // Implementation
}

// Export hooks
export function useTheme() { }
export function useColorScheme() { }
export function useDensity() { }
```

---

## Phase 3: Dynamic Theme Generation 🌈

### 3.1 Material Color Utilities Integration
**Goal:** Generate M3-compliant tonal palettes from any color

**Tasks:**
- [ ] Install `@material/material-color-utilities`
- [ ] Create `generateTheme()` function in tokens package
- [ ] Support HEX, RGB, HSL input formats
- [ ] Generate full tonal palette (0-100 shades)
- [ ] Export as ref.json or CSS variables

**API:**
```ts
import { generateTheme } from "@unisane/tokens/generator";

const theme = generateTheme({
  source: "#FF5722", // Brand color
  scheme: "light", // or "dark"
});

// Returns:
{
  primary: { 0: "#000", 10: "#...", ..., 100: "#fff" },
  secondary: { ... },
  tertiary: { ... },
  neutral: { ... },
  error: { ... }
}
```

### 3.2 Runtime Theme Injection
**Goal:** Allow runtime theme switching without rebuilding

**Tasks:**
- [ ] Create `injectTheme()` utility
- [ ] Accept theme object
- [ ] Generate CSS custom properties
- [ ] Inject via `<style>` tag
- [ ] Support theme presets

**Usage:**
```tsx
import { injectTheme } from "@unisane/ui/theme";

function App() {
  const applyBrandTheme = () => {
    injectTheme({
      primary: "#FF5722",
      secondary: "#2196F3",
    });
  };
}
```

---

## Phase 4: TypeScript Autocomplete 🔍

### 4.1 Extend Tailwind Types
**Goal:** Full autocomplete for M3 color tokens and typography

**Tasks:**
- [ ] Create `types/tailwind.d.ts` in ui package
- [ ] Define all color tokens
- [ ] Define typography scales
- [ ] Export from package

**File:** `packages/ui/types/tailwind.d.ts`
```ts
declare module 'tailwindcss' {
  interface Config {
    theme: {
      colors: {
        primary: string;
        'on-primary': string;
        'primary-container': string;
        'on-primary-container': string;
        // ... all M3 roles
      };
      fontSize: {
        'display-large': [string, { lineHeight: string }];
        'display-medium': [string, { lineHeight: string }];
        // ... all 15 type scales
      };
    }
  }
}
```

### 4.2 Component Prop Types
**Goal:** Better IntelliSense for component props

**Tasks:**
- [ ] Export all variant types from components
- [ ] Create comprehensive JSDoc comments
- [ ] Add usage examples in JSDoc
- [ ] Document accessibility props

**Example:**
```tsx
export interface ButtonProps {
  /**
   * Visual style variant
   * @default "filled"
   *
   * Variants:
   * - `filled`: High emphasis, primary actions (CTAs)
   * - `tonal`: Medium emphasis, secondary actions
   * - `outlined`: Low emphasis, tertiary actions
   * - `text`: Lowest emphasis, inline actions
   * - `elevated`: Special emphasis with shadow
   */
  variant?: "filled" | "tonal" | "outlined" | "text" | "elevated";

  /**
   * Size preset
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
}
```

---

## Phase 5: Documentation System 📚

### 5.1 Customization Guide
**File:** `docs/customization.md`

**Sections:**
1. **Quick Start**
   - Installing the system
   - Basic theme setup
   - First component

2. **Color Customization**
   - Option A: Override CSS variables (simple)
   - Option B: Modify ref.json (full control)
   - Option C: Generate from brand color (automatic)

3. **Spacing System**
   - When to use `4u` vs `4`
   - Recommendation: Use `4u` for M3 compliance
   - Migration guide from legacy spacing

4. **Density Presets**
   - dense, compact, standard, comfortable
   - When to use each
   - Custom density values

5. **Theme Switching**
   - Light/dark mode
   - Radius themes
   - Runtime vs build-time

### 5.2 Component Usage Guide
**File:** `docs/components/button.md`

**Template for each component:**
```md
# Button

Material 3 button with state layers and ripple effects.

## Import
\`\`\`tsx
import { Button } from "@unisane/ui";
\`\`\`

## Variants

### Filled (Primary)
Use for primary CTAs (max 1 per screen).
\`\`\`tsx
<Button variant="filled">Continue</Button>
\`\`\`

### Tonal (Secondary)
Use for important but not primary actions.
\`\`\`tsx
<Button variant="tonal">Save Draft</Button>
\`\`\`

[... rest of variants ...]

## Accessibility
- ✅ Keyboard navigation (Enter/Space)
- ✅ Focus indicators
- ✅ ARIA labels supported
- ✅ Screen reader tested

## Props
[Auto-generated from TypeScript]
```

### 5.3 Spacing System Documentation
**File:** `docs/spacing.md`

**Content:**
```md
# Spacing System

Unisane UI uses a dual spacing system for maximum flexibility.

## Recommended: Industrial Units (`4u`, `8u`)

Based on Material 3's 4dp grid system with automatic scaling.

\`\`\`tsx
// ✅ Recommended
<div className="p-4u gap-2u">

// At standard density: p-4u = 16px, gap-2u = 8px
// At compact density: p-4u = 14px, gap-2u = 7px
\`\`\`

## Legacy: Fixed Multiples (`4`, `8`)

Traditional Tailwind approach (still supported).

\`\`\`tsx
// ⚠️ Legacy (still works)
<div className="p-4 gap-2">

// Always 16px and 8px regardless of density
\`\`\`

## When to Use Each

| Scenario | System | Reason |
|----------|--------|--------|
| Component internal spacing | `4u` | Scales with density |
| Layout gaps | `4u` | Better responsive |
| Fixed-size constraints | `4` | Exact pixels needed |
| Matching designs | `4u` | M3 compliant |

## Migration

Replace fixed spacing with industrial units:
- `p-4` → `p-4u` (16px → scales with density)
- `gap-2` → `gap-2u` (8px → scales)
```

---

## Phase 6: Accessibility Audit ♿

### 6.1 Component Checklist

For each component, verify:

**Keyboard Navigation:**
- [ ] Tab order is logical
- [ ] Enter/Space trigger actions
- [ ] Escape closes overlays
- [ ] Arrow keys for lists/menus

**Focus Indicators:**
- [ ] Visible focus ring on all interactive elements
- [ ] Uses `focus-visible` not `focus`
- [ ] Minimum 2px outline
- [ ] High contrast focus color

**ARIA Labels:**
- [ ] Buttons have accessible names
- [ ] Icons have aria-label or sr-only text
- [ ] Form fields have associated labels
- [ ] Dynamic content has aria-live

**Color Contrast:**
- [ ] Text meets WCAG AA (4.5:1)
- [ ] Large text meets 3:1
- [ ] Interactive elements meet 3:1
- [ ] M3 tones guarantee this (verify)

**Screen Reader:**
- [ ] Meaningful reading order
- [ ] State changes announced
- [ ] Error messages associated
- [ ] Loading states announced

### 6.2 Automated Testing
**Tools:**
- axe-core for automated checks
- Pa11y for CI integration
- Lighthouse for scoring

**Files to create:**
```
packages/ui/
├── tests/
│   ├── accessibility/
│   │   ├── button.test.ts
│   │   ├── dialog.test.ts
│   │   └── ...
```

---

## Phase 7: Storybook Integration 📖

### 7.1 Setup
**Tasks:**
- [ ] Install Storybook in `apps/docs`
- [ ] Configure with Tailwind v4
- [ ] Import Unisane UI tokens
- [ ] Set up MDX support

**Command:**
```bash
cd apps/docs
npx storybook@latest init
```

### 7.2 Interactive Theme Controls
**Goal:** Live theme customization in Storybook

**Toolbar Controls:**
- Density: Dense | Compact | Standard | Comfortable
- Theme: Light | Dark
- Radius: Sharp | Standard | Soft
- Color Scheme: Default | Brand 1 | Brand 2 | Custom

**Implementation:**
```tsx
// .storybook/preview.tsx
import { ThemeProvider } from "@unisane/ui";

export const decorators = [
  (Story, context) => (
    <ThemeProvider
      config={{
        density: context.globals.density,
        theme: context.globals.theme,
        radius: context.globals.radius,
      }}
    >
      <Story />
    </ThemeProvider>
  ),
];

export const globalTypes = {
  density: {
    name: "Density",
    description: "UI density preset",
    defaultValue: "standard",
    toolbar: {
      icon: "grow",
      items: ["dense", "compact", "standard", "comfortable"],
    },
  },
  // ... theme, radius
};
```

### 7.3 Component Stories
**Template for each component:**

**File:** `stories/Button.stories.tsx`
```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@unisane/ui';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Material 3 button with ripple effects and state layers.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['filled', 'tonal', 'outlined', 'text', 'elevated'],
      description: 'Visual style variant',
      table: {
        defaultValue: { summary: 'filled' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Filled: Story = {
  args: {
    variant: 'filled',
    children: 'Button',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4u">
      <Button variant="filled">Filled</Button>
      <Button variant="tonal">Tonal</Button>
      <Button variant="outlined">Outlined</Button>
      <Button variant="text">Text</Button>
      <Button variant="elevated">Elevated</Button>
    </div>
  ),
};
```

---

## Phase 8: Registry & Distribution 📦

### 8.1 Component Registry
**File:** `packages/ui/scripts/build-registry.mjs`

**Tasks:**
- [ ] Script to generate registry.json from components
- [ ] Extract dependencies automatically
- [ ] Generate component metadata
- [ ] Create tarball for distribution

**Generated registry.json:**
```json
{
  "$schema": "./registry-schema.json",
  "components": {
    "button": {
      "name": "Button",
      "description": "Material 3 button with 5 variants",
      "type": "components:ui",
      "files": ["components/button.tsx"],
      "dependencies": ["@unisane/ui"],
      "registryDependencies": ["ripple"],
      "accessibility": {
        "keyboard": true,
        "screenReader": true,
        "contrast": "AAA"
      },
      "variants": {
        "variant": ["filled", "tonal", "outlined", "text", "elevated"],
        "size": ["sm", "md", "lg"]
      }
    }
  }
}
```

### 8.2 NPM Publishing
**Tasks:**
- [ ] Configure publishConfig in package.json
- [ ] Add .npmignore files
- [ ] Create pre-publish build script
- [ ] Set up changesets for versioning
- [ ] Create GitHub Actions workflow

**Packages to publish:**
- `@unisane/ui` - Component library
- `@unisane/tokens` - Design tokens
- `@unisane/cli` - CLI tool
- `@unisane/tailwind-config` - Tailwind preset

---

## Implementation Order

### Week 1: Core Infrastructure ✅
1. ✅ Registry system
2. ✅ Enhanced ThemeProvider with dark mode
3. ✅ CLI improvements (add registry support)

### Week 2: Theme System 🎨
4. Dynamic theme generation
5. Runtime theme injection
6. Theme switcher components

### Week 3: Developer Experience 🛠️
7. TypeScript autocomplete
8. Customization documentation
9. Component usage guides

### Week 4: Quality Assurance ♿
10. Accessibility audit
11. Automated testing
12. Component consistency review

### Week 5: Documentation & Distribution 📚
13. Storybook setup
14. Interactive demos
15. NPM publishing

---

## Success Metrics

### Developer Experience
- [ ] Time to first component: < 5 minutes
- [ ] CLI command success rate: > 95%
- [ ] Documentation completeness: 100%

### Accessibility
- [ ] All components WCAG AA compliant
- [ ] Keyboard navigation: 100% coverage
- [ ] Screen reader tested: All components

### Performance
- [ ] Bundle size: < 50KB per component
- [ ] Tree-shaking: Effective
- [ ] Build time: < 30s for full library

### Adoption
- [ ] GitHub stars: Track growth
- [ ] NPM downloads: Monitor weekly
- [ ] Community issues: < 48hr response

---

## Next Steps

1. **Review this plan** - Confirm approach and priorities
2. **Start with Phase 1** - Registry system foundation
3. **Iterate quickly** - Release early, gather feedback
4. **Build community** - Encourage contributions

---

## Questions to Answer

1. **Spacing migration:** Deprecate legacy `p-4` or keep both?
   - **Recommendation:** Keep both, document `4u` as preferred

2. **Theme generation:** Build-time or runtime?
   - **Recommendation:** Support both (build = performance, runtime = flexibility)

3. **Storybook vs custom docs:** Which for main documentation?
   - **Recommendation:** Storybook for components, custom site for guides

4. **Distribution strategy:** Monorepo or separate repos?
   - **Recommendation:** Monorepo for development, publish as separate packages
