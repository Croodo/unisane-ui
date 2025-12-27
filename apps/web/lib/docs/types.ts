/**
 * Component Documentation Types
 *
 * This file defines all TypeScript interfaces for component documentation.
 * Following a structured approach for scalability and maintainability.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

export type ComponentCategory =
  | "actions"
  | "containment"
  | "communication"
  | "selection"
  | "navigation"
  | "text-inputs"
  | "data-display"
  | "layout"
  | "foundations";

export type ComponentStatus = "stable" | "beta" | "experimental" | "deprecated";

// =============================================================================
// PROP DOCUMENTATION
// =============================================================================

export interface PropDef {
  /** Property name */
  name: string;
  /** TypeScript type as string */
  type: string;
  /** Default value if any */
  default?: string;
  /** Whether the prop is required */
  required?: boolean;
  /** Description of what this prop does */
  description: string;
}

// =============================================================================
// VARIANT DOCUMENTATION
// =============================================================================

export interface VariantOption {
  /** Variant value */
  value: string;
  /** Human-readable label */
  label: string;
  /** Description of when to use this variant */
  description?: string;
}

export interface VariantDef {
  /** Variant name (e.g., "variant", "size") */
  name: string;
  /** TypeScript type */
  type: string;
  /** Default value */
  default: string;
  /** Available options */
  options: VariantOption[];
}

// =============================================================================
// EXAMPLE DOCUMENTATION
// =============================================================================

export interface ExampleDef {
  /** Unique identifier for the example */
  id: string;
  /** Title shown in the example header */
  title: string;
  /** Description of what the example demonstrates */
  description?: string;
  /** The actual component to render */
  component: React.ReactNode;
  /** Source code to display (optional - shown in code tab) */
  code?: string;
}

// =============================================================================
// ACCESSIBILITY DOCUMENTATION
// =============================================================================

export interface AccessibilityNote {
  /** Type of accessibility feature */
  type: "keyboard" | "screen-reader" | "focus" | "aria" | "motion";
  /** Description of the accessibility feature */
  description: string;
}

export interface AccessibilityDef {
  /** List of keyboard shortcuts/interactions */
  keyboard?: Array<{
    key: string;
    description: string;
  }>;
  /** Screen reader considerations */
  screenReader?: string[];
  /** Focus management notes */
  focus?: string[];
  /** ARIA attributes used */
  aria?: string[];
  /** Motion/animation considerations */
  motion?: string[];
}

// =============================================================================
// USAGE GUIDELINES
// =============================================================================

export interface UsageGuideline {
  /** Type of guideline */
  type: "do" | "dont" | "caution";
  /** The guideline text */
  text: string;
  /** Optional visual example */
  example?: React.ReactNode;
}

// =============================================================================
// RELATED COMPONENTS
// =============================================================================

export interface RelatedComponent {
  /** Component slug for linking */
  slug: string;
  /** Why this component is related */
  reason: string;
}

// =============================================================================
// CHOOSING TABLE (for variant selection guidance)
// =============================================================================

export interface ChoosingTableRow {
  /** Level of emphasis or type label */
  emphasis: string;
  /** Component visual rendered inline */
  component: React.ReactNode;
  /** Why/when to use this variant */
  rationale: string;
  /** Example action labels */
  examples?: string;
}

export interface ChoosingTableDef {
  /** Section description */
  description?: string;
  /** Column headers customization */
  columns?: {
    emphasis?: string;
    component?: string;
    rationale?: string;
    examples?: string;
  };
  /** Table rows */
  rows: ChoosingTableRow[];
}

// =============================================================================
// HIERARCHY/TYPES VISUAL SECTION
// =============================================================================

export interface HierarchyItem {
  /** Component visual */
  component: React.ReactNode;
  /** Title (e.g., "High emphasis") */
  title: string;
  /** Subtitle (e.g., "Filled button") */
  subtitle?: string;
}

export interface HierarchySectionDef {
  /** Section description */
  description?: string;
  /** Items to display in grid */
  items: HierarchyItem[];
}

// =============================================================================
// PLACEMENT/USAGE EXAMPLES SECTION
// =============================================================================

export interface PlacementExample {
  /** Example title (e.g., "Dialog placement") */
  title: string;
  /** The visual example */
  visual: React.ReactNode;
  /** Caption explaining the placement */
  caption?: string;
}

export interface PlacementSectionDef {
  /** Section description */
  description?: string;
  /** Placement examples */
  examples: PlacementExample[];
}

// =============================================================================
// MAIN COMPONENT DOCUMENTATION INTERFACE
// =============================================================================

export interface ComponentDoc {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  /** URL-friendly identifier */
  slug: string;
  /** Display name */
  name: string;
  /** Brief one-liner description */
  description: string;
  /** Category for grouping */
  category: ComponentCategory;
  /** Stability status */
  status: ComponentStatus;
  /** Material Symbol icon name */
  icon?: string;

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  /** Package/path to import from */
  importPath?: string;
  /** Named exports available */
  exports?: string[];

  // ─── HERO SECTION ──────────────────────────────────────────────────────────
  /** Hero visual component for the page header */
  heroVisual?: React.ReactNode;

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  /** Table showing how to choose between variants */
  choosing?: ChoosingTableDef;

  // ─── HIERARCHY/TYPES SECTION ───────────────────────────────────────────────
  /** Visual grid showing component hierarchy or types */
  hierarchy?: HierarchySectionDef;

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  /** Examples of component placement in context */
  placement?: PlacementSectionDef;

  // ─── VARIANTS & PROPS ───────────────────────────────────────────────────────
  /** Available variants with their options */
  variants?: VariantDef[];
  /** Component props documentation */
  props?: PropDef[];
  /** Sub-components (e.g., Card.Header, Tabs.Content) */
  subComponents?: Array<{
    name: string;
    description: string;
    props?: PropDef[];
  }>;

  // ─── EXAMPLES ───────────────────────────────────────────────────────────────
  /** Interactive examples */
  examples?: ExampleDef[];

  // ─── GUIDELINES ─────────────────────────────────────────────────────────────
  /** Usage dos and don'ts */
  guidelines?: UsageGuideline[];
  /** Accessibility documentation */
  accessibility?: AccessibilityDef;

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  /** Implementation code example */
  implementation?: {
    description?: string;
    code: string;
  };

  // ─── RELATIONSHIPS ──────────────────────────────────────────────────────────
  /** Related/similar components */
  related?: RelatedComponent[];
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/** Minimal component info for listings */
export type ComponentListItem = Pick<
  ComponentDoc,
  "slug" | "name" | "description" | "category" | "status" | "icon"
>;

/** Full component data with examples (for detail pages) */
export type ComponentDetail = ComponentDoc;

// =============================================================================
// CATEGORY METADATA
// =============================================================================

export interface CategoryMeta {
  id: ComponentCategory;
  label: string;
  description: string;
  icon: string;
}

export const CATEGORY_META: CategoryMeta[] = [
  {
    id: "actions",
    label: "Actions",
    description: "Buttons and interactive elements that trigger actions.",
    icon: "touch_app",
  },
  {
    id: "containment",
    label: "Containment",
    description: "Components that contain and organize other content.",
    icon: "crop_square",
  },
  {
    id: "communication",
    label: "Communication",
    description: "Components that communicate status and feedback.",
    icon: "chat",
  },
  {
    id: "selection",
    label: "Selection",
    description: "Controls for selecting options and values.",
    icon: "check_circle",
  },
  {
    id: "text-inputs",
    label: "Text Inputs",
    description: "Components for entering and editing text data.",
    icon: "edit_note",
  },
  {
    id: "navigation",
    label: "Navigation",
    description: "Components for navigating between screens and content.",
    icon: "menu",
  },
  {
    id: "data-display",
    label: "Data Display",
    description: "Components for displaying data and content.",
    icon: "table_chart",
  },
  {
    id: "layout",
    label: "Layout",
    description: "Components for structuring and organizing layouts.",
    icon: "grid_view",
  },
];
