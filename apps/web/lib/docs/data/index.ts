/**
 * Component Documentation Data Index
 *
 * This file aggregates all component documentation and provides
 * helper functions to access them.
 */

import type { ComponentDoc, ComponentCategory, ComponentListItem } from "../types";

// ─── DETAILED COMPONENT DOCS ──────────────────────────────────────────────────
// Import detailed docs as they are created
import { buttonDoc } from "./button";
import { cardDoc } from "./card";

/**
 * Registry of all components with full documentation.
 * Components with detailed docs will override the basic registry entries.
 */
const DETAILED_DOCS: Record<string, ComponentDoc> = {
  button: buttonDoc,
  card: cardDoc,
};

// ─── BASIC COMPONENT REGISTRY ─────────────────────────────────────────────────
// This contains all components (with or without detailed docs)
export const COMPONENT_REGISTRY: ComponentListItem[] = [
  // Actions
  {
    slug: "button",
    name: "Button",
    description:
      "Buttons help people take action, such as sending an email, sharing a document, or liking a comment.",
    category: "actions",
    status: "stable",
    icon: "smart_button",
  },
  {
    slug: "icon-button",
    name: "Icon Button",
    description:
      "Icon buttons display actions in a compact form, often used in toolbars and app bars.",
    category: "actions",
    status: "stable",
    icon: "touch_app",
  },
  {
    slug: "fab",
    name: "FAB",
    description:
      "Floating action buttons represent the primary action of a screen.",
    category: "actions",
    status: "stable",
    icon: "add_circle",
  },
  {
    slug: "fab-menu",
    name: "FAB Menu",
    description:
      "Extended FAB with a menu of related actions that expand on interaction.",
    category: "actions",
    status: "stable",
    icon: "more_vert",
  },
  {
    slug: "segmented-button",
    name: "Segmented Button",
    description:
      "Segmented buttons help people select options, switch views, or sort elements.",
    category: "actions",
    status: "stable",
    icon: "view_column",
  },

  // Containment
  {
    slug: "card",
    name: "Card",
    description: "Cards contain content and actions about a single subject.",
    category: "containment",
    status: "stable",
    icon: "dashboard",
  },
  {
    slug: "dialog",
    name: "Dialog",
    description:
      "Dialogs provide important prompts in a user flow, requiring user input or confirmation.",
    category: "containment",
    status: "stable",
    icon: "chat_bubble",
  },
  {
    slug: "sheet",
    name: "Sheet",
    description:
      "Sheets are surfaces containing supplementary content anchored to the edge of the screen.",
    category: "containment",
    status: "stable",
    icon: "view_sidebar",
  },
  {
    slug: "accordion",
    name: "Accordion",
    description:
      "Accordions display collapsible content panels for presenting information in a limited amount of space.",
    category: "containment",
    status: "stable",
    icon: "expand_more",
  },
  {
    slug: "popover",
    name: "Popover",
    description:
      "Popovers display rich content in a portal that appears above other content.",
    category: "containment",
    status: "stable",
    icon: "info",
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    description:
      "Tooltips display informative text when users hover over, focus on, or tap an element.",
    category: "containment",
    status: "stable",
    icon: "help",
  },
  {
    slug: "dropdown-menu",
    name: "Dropdown Menu",
    description: "Dropdown menus display a list of choices on a temporary surface.",
    category: "containment",
    status: "stable",
    icon: "menu",
  },

  // Communication
  {
    slug: "alert",
    name: "Alert",
    description: "Alerts display brief messages with different severity levels.",
    category: "communication",
    status: "stable",
    icon: "error",
  },
  {
    slug: "banner",
    name: "Banner",
    description:
      "Banners display important, succinct messages with optional actions.",
    category: "communication",
    status: "stable",
    icon: "campaign",
  },
  {
    slug: "snackbar",
    name: "Snackbar",
    description:
      "Snackbars provide brief messages about app processes at the bottom of the screen.",
    category: "communication",
    status: "stable",
    icon: "notifications",
  },
  {
    slug: "badge",
    name: "Badge",
    description:
      "Badges convey dynamic information, such as counts or status indicators.",
    category: "communication",
    status: "stable",
    icon: "new_releases",
  },
  {
    slug: "progress",
    name: "Progress",
    description:
      "Progress indicators express an unspecified wait time or display the length of a process.",
    category: "communication",
    status: "stable",
    icon: "autorenew",
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    description:
      "Skeleton loaders provide a placeholder preview of content before it loads.",
    category: "communication",
    status: "stable",
    icon: "rectangle",
  },

  // Selection
  {
    slug: "checkbox",
    name: "Checkbox",
    description:
      "Checkboxes let users select one or more items from a list, or turn an item on or off.",
    category: "selection",
    status: "stable",
    icon: "check_box",
  },
  {
    slug: "radio",
    name: "Radio",
    description:
      "Radio buttons let users select one option from a set of mutually exclusive choices.",
    category: "selection",
    status: "stable",
    icon: "radio_button_checked",
  },
  {
    slug: "switch",
    name: "Switch",
    description: "Switches toggle the state of a single item on or off.",
    category: "selection",
    status: "stable",
    icon: "toggle_on",
  },
  {
    slug: "chip",
    name: "Chip",
    description:
      "Chips help people enter information, make selections, filter content, or trigger actions.",
    category: "selection",
    status: "stable",
    icon: "label",
  },
  {
    slug: "slider",
    name: "Slider",
    description: "Sliders let users make selections from a range of values.",
    category: "selection",
    status: "stable",
    icon: "tune",
  },
  {
    slug: "rating",
    name: "Rating",
    description:
      "Ratings let users provide feedback on content using a star-based scale.",
    category: "selection",
    status: "stable",
    icon: "star",
  },

  // Text Inputs
  {
    slug: "text-field",
    name: "Text Field",
    description: "Text fields let users enter and edit text.",
    category: "text-inputs",
    status: "stable",
    icon: "edit",
  },
  {
    slug: "select",
    name: "Select",
    description:
      "Select components let users choose a single value from a list of options.",
    category: "text-inputs",
    status: "stable",
    icon: "arrow_drop_down",
  },
  {
    slug: "combobox",
    name: "Combobox",
    description:
      "Comboboxes combine a text input with a listbox, allowing users to filter a list of options.",
    category: "text-inputs",
    status: "stable",
    icon: "search",
  },
  {
    slug: "search-bar",
    name: "Search Bar",
    description: "Search bars let users enter a query to search for content.",
    category: "text-inputs",
    status: "stable",
    icon: "search",
  },
  {
    slug: "date-picker",
    name: "Date Picker",
    description:
      "Date pickers let users select dates or date ranges from a calendar.",
    category: "text-inputs",
    status: "stable",
    icon: "calendar_today",
  },
  {
    slug: "time-picker",
    name: "Time Picker",
    description: "Time pickers let users select times using a clock or input.",
    category: "text-inputs",
    status: "stable",
    icon: "schedule",
  },

  // Navigation
  {
    slug: "navigation-rail",
    name: "Navigation Rail",
    description:
      "Navigation rails provide access to primary destinations in an app on tablet and desktop screens.",
    category: "navigation",
    status: "stable",
    icon: "view_sidebar",
  },
  {
    slug: "navigation-drawer",
    name: "Navigation Drawer",
    description:
      "Navigation drawers provide access to destinations and app functionality.",
    category: "navigation",
    status: "stable",
    icon: "menu_open",
  },
  {
    slug: "navigation-bar",
    name: "Navigation Bar",
    description:
      "Navigation bars display three to five destinations at the bottom of mobile screens.",
    category: "navigation",
    status: "stable",
    icon: "bottom_navigation",
  },
  {
    slug: "top-app-bar",
    name: "Top App Bar",
    description:
      "Top app bars display information and actions at the top of a screen.",
    category: "navigation",
    status: "stable",
    icon: "web_asset",
  },
  {
    slug: "bottom-app-bar",
    name: "Bottom App Bar",
    description:
      "Bottom app bars display navigation and key actions at the bottom of mobile screens.",
    category: "navigation",
    status: "stable",
    icon: "call_to_action",
  },
  {
    slug: "tabs",
    name: "Tabs",
    description:
      "Tabs organize content across different screens, data sets, or interactions.",
    category: "navigation",
    status: "stable",
    icon: "tab",
  },
  {
    slug: "breadcrumb",
    name: "Breadcrumb",
    description:
      "Breadcrumbs indicate the current page's location within a navigational hierarchy.",
    category: "navigation",
    status: "stable",
    icon: "chevron_right",
  },
  {
    slug: "pagination",
    name: "Pagination",
    description: "Pagination lets users navigate through pages of content.",
    category: "navigation",
    status: "stable",
    icon: "last_page",
  },
  {
    slug: "stepper",
    name: "Stepper",
    description:
      "Steppers display progress through a sequence of logical and numbered steps.",
    category: "navigation",
    status: "stable",
    icon: "format_list_numbered",
  },

  // Data Display
  {
    slug: "table",
    name: "Table",
    description: "Tables display sets of data organized in rows and columns.",
    category: "data-display",
    status: "stable",
    icon: "table_chart",
  },
  {
    slug: "list",
    name: "List",
    description: "Lists are continuous, vertical indexes of text or images.",
    category: "data-display",
    status: "stable",
    icon: "list",
  },
  {
    slug: "avatar",
    name: "Avatar",
    description: "Avatars display user profile images, initials, or icons.",
    category: "data-display",
    status: "stable",
    icon: "account_circle",
  },
  {
    slug: "carousel",
    name: "Carousel",
    description:
      "Carousels display a collection of items that can be scrolled horizontally.",
    category: "data-display",
    status: "stable",
    icon: "view_carousel",
  },
  {
    slug: "calendar",
    name: "Calendar",
    description: "Calendars display dates for scheduling and viewing events.",
    category: "data-display",
    status: "stable",
    icon: "calendar_month",
  },

  // Layout
  {
    slug: "divider",
    name: "Divider",
    description: "Dividers separate content into clear groups or sections.",
    category: "layout",
    status: "stable",
    icon: "horizontal_rule",
  },
  {
    slug: "scroll-area",
    name: "Scroll Area",
    description:
      "Scroll areas provide a scrollable container with custom scrollbars.",
    category: "layout",
    status: "stable",
    icon: "unfold_more",
  },
  {
    slug: "pane-group",
    name: "Pane Group",
    description:
      "Pane groups create resizable panel layouts for complex interfaces.",
    category: "layout",
    status: "stable",
    icon: "view_column",
  },
  {
    slug: "canonical-layouts",
    name: "Canonical Layouts",
    description:
      "Pre-built responsive layouts following Material Design 3 patterns.",
    category: "layout",
    status: "stable",
    icon: "grid_view",
  },
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Get a component by its slug.
 * Returns detailed doc if available, otherwise basic info.
 */
export function getComponentBySlug(slug: string): ComponentDoc | undefined {
  // Check if we have detailed docs
  if (DETAILED_DOCS[slug]) {
    return DETAILED_DOCS[slug];
  }

  // Fall back to basic registry
  const basicInfo = COMPONENT_REGISTRY.find((c) => c.slug === slug);
  if (basicInfo) {
    return basicInfo as ComponentDoc;
  }

  return undefined;
}

/**
 * Check if a component has detailed documentation.
 */
export function hasDetailedDocs(slug: string): boolean {
  return slug in DETAILED_DOCS;
}

/**
 * Get components grouped by category.
 */
export function getComponentsByCategory(): Record<ComponentCategory, ComponentListItem[]> {
  const grouped: Record<ComponentCategory, ComponentListItem[]> = {
    actions: [],
    containment: [],
    communication: [],
    selection: [],
    navigation: [],
    "text-inputs": [],
    "data-display": [],
    layout: [],
  };

  for (const component of COMPONENT_REGISTRY) {
    grouped[component.category].push(component);
  }

  return grouped;
}

/**
 * Get all components as a flat list.
 */
export function getAllComponents(): ComponentListItem[] {
  return COMPONENT_REGISTRY;
}

/**
 * Get total component count.
 */
export function getComponentCount(): number {
  return COMPONENT_REGISTRY.length;
}

/**
 * Search components by name or description.
 */
export function searchComponents(query: string): ComponentListItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return COMPONENT_REGISTRY;

  return COMPONENT_REGISTRY.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
  );
}

// ─── CATEGORY UTILITIES ───────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  actions: "Actions",
  containment: "Containment",
  communication: "Communication",
  selection: "Selection",
  navigation: "Navigation",
  "text-inputs": "Text Inputs",
  "data-display": "Data Display",
  layout: "Layout",
};

export const CATEGORY_ICONS: Record<ComponentCategory, string> = {
  actions: "touch_app",
  containment: "crop_square",
  communication: "chat",
  selection: "check_circle",
  navigation: "menu",
  "text-inputs": "edit_note",
  "data-display": "table_chart",
  layout: "grid_view",
};

/**
 * Get previous and next components for navigation.
 */
export function getAdjacentComponents(slug: string): {
  previous?: { slug: string; name: string };
  next?: { slug: string; name: string };
} {
  const index = COMPONENT_REGISTRY.findIndex((c) => c.slug === slug);

  if (index === -1) {
    return {};
  }

  const prevComponent = index > 0 ? COMPONENT_REGISTRY[index - 1] : undefined;
  const nextComponent = index < COMPONENT_REGISTRY.length - 1 ? COMPONENT_REGISTRY[index + 1] : undefined;

  return {
    previous: prevComponent ? { slug: prevComponent.slug, name: prevComponent.name } : undefined,
    next: nextComponent ? { slug: nextComponent.slug, name: nextComponent.name } : undefined,
  };
}
