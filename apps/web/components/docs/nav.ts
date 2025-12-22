export interface NavItem {
  title: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const docsNav: NavGroup = {
  title: "Docs",
  items: [
    {
      title: "Overview",
      href: "/docs",
      description: "Getting started with Unisane UI.",
    },
    {
      title: "Theming",
      href: "/docs/theming",
      description: "Tokens, density, and color strategy.",
    },
  ],
};

export const componentEntries: NavItem[] = [
  {
    title: "Button",
    href: "/components/button",
    description: "Primary actions and tonal variants.",
  },
  {
    title: "Text Field",
    href: "/components/text-field",
    description: "Floating labels and dense inputs.",
  },
  {
    title: "Select",
    href: "/components/select",
    description: "Single-select menus with compact density.",
  },
  {
    title: "Checkbox",
    href: "/components/checkbox",
    description: "Selection controls with indeterminate states.",
  },
  {
    title: "Switch",
    href: "/components/switch",
    description: "Binary toggles with icon options.",
  },
  {
    title: "Tabs",
    href: "/components/tabs",
    description: "Segmented views for dense pages.",
  },
  {
    title: "Card",
    href: "/components/card",
    description: "Elevated and outlined surfaces.",
  },
  {
    title: "Table",
    href: "/components/table",
    description: "Structured data layouts.",
  },
  {
    title: "Alert",
    href: "/components/alert",
    description: "Inline feedback states.",
  },
  {
    title: "Dialog",
    href: "/components/dialog",
    description: "Modal confirmations.",
  },
  {
    title: "Snackbar",
    href: "/components/snackbar",
    description: "Transient notifications.",
  },
];

export const componentsNav: NavGroup = {
  title: "Components",
  items: [
    {
      title: "All Components",
      href: "/components",
      description: "Component catalog overview.",
    },
    ...componentEntries,
  ],
};

export const navGroups: NavGroup[] = [docsNav, componentsNav];
