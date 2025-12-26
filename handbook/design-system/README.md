# Design System Documentation

Complete guide to building a design token-based theming system with Material Design 3 components in Next.js.

## Table of Contents

### Foundation (Setup & Core)
1. [Getting Started](./01-getting-started.md) - Complete setup guide with design tokens and Tailwind integration
2. [Utilities](./02-utilities.md) - Ripple, StateLayer, FocusRing, Portal, VisuallyHidden, FocusTrap, Hooks
3. [Layout](./03-layout.md) - Container, Grid, Stack, Spacer

### Basic Components (Most Common)
4. [Buttons & Actions](./04-buttons-actions.md) - Button, IconButton, FAB, SegmentedButton
5. [Inputs & Forms](./05-inputs-forms.md) - TextField, Select, Checkbox, Radio, Switch, Slider
6. [Display](./06-display.md) - Typography, List, Chip, Avatar, Divider
7. [Containers](./07-containers.md) - Card, Dialog, Sheet, Popover

### Navigation & Feedback
8. [Navigation](./08-navigation.md) - NavigationRail, NavigationDrawer, TopAppBar, Tabs
9. [Feedback](./09-feedback.md) - Snackbar, Alert, Progress, Badge
10. [Overlays](./10-overlays.md) - Tooltip, Menu, Dropdown, BottomSheet

### Data & Media
11. [Data Display](./11-data-display.md) - Table, DataGrid, EmptyState, Stat
12. [Media](./12-media.md) - Image, ImageGallery, FileUpload, Carousel

### Advanced & Specialized
13. [Advanced](./13-advanced.md) - ScrollArea, Accordion, Breadcrumb, Stepper, Timeline
14. [Specialized](./14-specialized.md) - Resizable, ContextMenu, Command, DatePicker, Combobox
15. [Forms Extended](./15-forms-extended.md) - ToggleGroup, RadioGroup, CheckboxGroup, Form, Label
16. [Pagination & Rating](./16-pagination-rating.md) - Pagination, SimplePagination, Rating, RatingDisplay

## Quick Links

- **Setup**: Start with [Getting Started](./01-getting-started.md) for token system and Tailwind config
- **Components**: Browse by category to see complete component implementations
- **Patterns**: Each component includes:
  - Complete TypeScript code
  - Props interface
  - Variants and states
  - Usage examples
  - Accessibility considerations

## Architecture Overview

### Design Tokens
All components consume design tokens defined as CSS custom properties:
- Colors (semantic roles)
- Typography (Material Design 3 scale)
- Spacing (industrial unit system)
- Elevation (shadows)
- Motion (durations & easings)

### Tailwind Integration
Tokens are mapped to clean Tailwind classes via `@theme`:
```tsx
<div className="bg-primary text-on-primary p-4u rounded-sm shadow-2">
```

### Component Patterns
1. **Semantic Props**: `variant`, `size`, `color`
2. **Design Tokens**: All styling via CSS variables
3. **TypeScript**: Full type safety with interfaces
4. **Accessibility**: ARIA attributes and keyboard support
5. **Theming**: Automatic light/dark mode support

## Philosophy

**Components should:**
- ✅ Consume design tokens, never define values
- ✅ Support variants for different use cases
- ✅ Include proper TypeScript types
- ✅ Handle focus, hover, active states
- ✅ Be accessible by default
- ✅ Work in light and dark themes

**Components should NOT:**
- ❌ Hardcode colors or spacing
- ❌ Use arbitrary Tailwind values
- ❌ Duplicate logic across variants
- ❌ Ignore accessibility
- ❌ Skip focus management
