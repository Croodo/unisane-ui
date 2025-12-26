import { COMPONENT_REGISTRY } from "./components";
import type { NavigationItem } from "@unisane/ui";

// Re-export for convenience
export type { NavigationItem };

// Alias for backwards compatibility
export type NavItem = NavigationItem;
export type NavCategory = NavigationItem;

// Generate component navigation items from registry
const componentNavItems: NavItem[] = COMPONENT_REGISTRY.map((c) => ({
  id: c.slug,
  label: c.name,
  href: `/docs/components/${c.slug}`,
}));

export const NAV_DATA: NavigationItem[] = [
  {
    id: "home",
    label: "Home",
    icon: "home",
    href: "/",
    items: [],
  },
  {
    id: "getting-started",
    label: "Get Started",
    icon: "rocket_launch",
    href: "/docs/getting-started",
    items: [
      {
        id: "installation",
        label: "Installation",
        href: "/docs/getting-started/installation",
      },
      {
        id: "quick-start",
        label: "Quick Start",
        href: "/docs/getting-started/quick-start",
      },
      {
        id: "styling",
        label: "Styling",
        href: "/docs/getting-started/styling",
      },
      {
        id: "theming",
        label: "Building Themes",
        href: "/docs/getting-started/theming",
      },
    ],
  },
  {
    id: "foundations",
    label: "Foundations",
    icon: "palette",
    href: "/docs/foundations",
    items: [
      {
        id: "design-tokens",
        label: "Design Tokens",
        href: "/docs/foundations/design-tokens",
      },
      {
        id: "typography",
        label: "Typography",
        href: "/docs/foundations/typography",
      },
      { id: "colors", label: "Colors", href: "/docs/foundations/colors" },
      { id: "spacing", label: "Spacing", href: "/docs/foundations/spacing" },
      {
        id: "elevation",
        label: "Elevation",
        href: "/docs/foundations/elevation",
      },
      { id: "motion", label: "Motion", href: "/docs/foundations/motion" },
    ],
  },
  {
    id: "components",
    label: "Components",
    icon: "widgets",
    href: "/docs/components",
    items: componentNavItems,
  },
  {
    id: "patterns",
    label: "Patterns",
    icon: "dashboard",
    href: "/docs/patterns",
    items: [
      { id: "layouts", label: "App Layouts", href: "/docs/patterns/layouts" },
      { id: "forms", label: "Forms", href: "/docs/patterns/forms" },
      {
        id: "navigation",
        label: "Navigation",
        href: "/docs/patterns/navigation",
      },
      { id: "data-display", label: "Data Display", href: "/docs/patterns/data" },
    ],
  },
];

// Helper to find active category based on pathname
export function getActiveCategoryId(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/docs/getting-started")) return "getting-started";
  if (pathname.startsWith("/docs/foundations")) return "foundations";
  if (pathname.startsWith("/docs/components")) return "components";
  if (pathname.startsWith("/docs/patterns")) return "patterns";
  return "home";
}

// Helper to find a category by ID
export function findCategory(id: string): NavCategory | undefined {
  return NAV_DATA.find((cat) => cat.id === id);
}
