"use client";

import { ComponentDoc } from "../types";
import { List, ListItem, ListSubheader, Card, Avatar, Checkbox, Switch } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const ListHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-secondary-container to-primary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-40px] left-[-40px] w-56 h-56 bg-secondary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-50px] right-[-30px] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

    {/* Mock List */}
    <div className="relative bg-surface w-[280px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 z-10">
      <div className="px-4u py-2u border-b border-outline-variant/20">
        <span className="text-label-medium text-on-surface-variant/70">Recent</span>
      </div>
      <div className="py-2u">
        <div className="flex items-center gap-4u px-4u py-2u hover:bg-on-surface/8">
          <div className="w-10u h-10u rounded-full bg-primary-container flex items-center justify-center">
            <span className="text-title-small text-on-primary-container">JD</span>
          </div>
          <div className="flex-1">
            <div className="text-body-medium text-on-surface">John Doe</div>
            <div className="text-label-small text-on-surface-variant">john@example.com</div>
          </div>
        </div>
        <div className="flex items-center gap-4u px-4u py-2u bg-primary/8">
          <div className="w-10u h-10u rounded-full bg-tertiary-container flex items-center justify-center">
            <span className="text-title-small text-on-tertiary-container">AS</span>
          </div>
          <div className="flex-1">
            <div className="text-body-medium text-primary">Alice Smith</div>
            <div className="text-label-small text-on-surface-variant">alice@example.com</div>
          </div>
        </div>
        <div className="flex items-center gap-4u px-4u py-2u hover:bg-on-surface/8">
          <div className="w-10u h-10u rounded-full bg-secondary-container flex items-center justify-center">
            <span className="text-title-small text-on-secondary-container">BJ</span>
          </div>
          <div className="flex-1">
            <div className="text-body-medium text-on-surface">Bob Johnson</div>
            <div className="text-label-small text-on-surface-variant">bob@example.com</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const listDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "list",
  name: "List",
  description:
    "Lists are continuous, vertical indexes of text and images.",
  category: "containment",
  status: "stable",
  icon: "list",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["List", "ListItem", "ListSubheader", "ListItemContent", "ListItemText"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <ListHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "List items can include various content configurations.",
    columns: {
      emphasis: "Type",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "One-line",
        component: (
          <div className="w-44 bg-surface rounded-sm border border-outline-variant/30">
            <div className="px-3u py-2u text-body-small text-on-surface">Simple item</div>
          </div>
        ),
        rationale:
          "For simple text-only items.",
        examples: "Menu items, Simple options",
      },
      {
        emphasis: "Two-line",
        component: (
          <div className="w-44 bg-surface rounded-sm border border-outline-variant/30">
            <div className="px-3u py-2u">
              <div className="text-body-small text-on-surface">Primary text</div>
              <div className="text-label-small text-on-surface-variant">Secondary text</div>
            </div>
          </div>
        ),
        rationale:
          "For items with supporting text.",
        examples: "Contact lists, Email previews",
      },
      {
        emphasis: "With icons",
        component: (
          <div className="w-44 bg-surface rounded-sm border border-outline-variant/30">
            <div className="flex items-center gap-3u px-3u py-2u">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">person</span>
              <div className="text-body-small text-on-surface">With leading icon</div>
            </div>
          </div>
        ),
        rationale:
          "For visual identification.",
        examples: "Settings, Navigation",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "List items support various content slots for flexible layouts.",
    items: [
      {
        component: (
          <ListItem headline="Headline only" className="w-40 bg-surface border border-outline-variant/30 rounded-sm" />
        ),
        title: "Single line",
        subtitle: "Text only",
      },
      {
        component: (
          <ListItem
            headline="With support"
            supportingText="Helper text"
            className="w-40 bg-surface border border-outline-variant/30 rounded-sm"
          />
        ),
        title: "Two-line",
        subtitle: "With description",
      },
      {
        component: (
          <ListItem
            headline="With trailing"
            trailingSupportingText="100+"
            className="w-40 bg-surface border border-outline-variant/30 rounded-sm"
          />
        ),
        title: "With metadata",
        subtitle: "Trailing text",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Lists are used for navigation, selection, and displaying grouped content.",
    examples: [
      {
        title: "Navigation list",
        visual: (
          <Card variant="outlined" padding="none" className="max-w-[280px] mx-auto overflow-hidden">
            <List>
              <ListItem
                headline="Dashboard"
                leadingIcon={<span className="material-symbols-outlined">dashboard</span>}
                active
              />
              <ListItem
                headline="Settings"
                leadingIcon={<span className="material-symbols-outlined">settings</span>}
              />
              <ListItem
                headline="Profile"
                leadingIcon={<span className="material-symbols-outlined">person</span>}
              />
            </List>
          </Card>
        ),
        caption: "Navigation with icons and active state",
      },
      {
        title: "Contact list",
        visual: (
          <Card variant="outlined" padding="none" className="max-w-[280px] mx-auto overflow-hidden">
            <List>
              <ListSubheader>Contacts</ListSubheader>
              <ListItem
                headline="John Doe"
                supportingText="john@example.com"
                leadingIcon={<Avatar size="sm" fallback="JD" />}
              />
              <ListItem
                headline="Jane Smith"
                supportingText="jane@example.com"
                leadingIcon={<Avatar size="sm" fallback="JS" />}
              />
            </List>
          </Card>
        ),
        caption: "List with avatars and subheader",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "List items to display.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes.",
    },
  ],

  // ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────
  subComponents: [
    {
      name: "ListItem",
      description: "Individual list item with flexible content slots.",
      props: [
        { name: "headline", type: "string", description: "Primary text content." },
        { name: "supportingText", type: "ReactNode", description: "Secondary text below headline." },
        { name: "leadingIcon", type: "ReactNode", description: "Icon or element at the start." },
        { name: "trailingIcon", type: "ReactNode", description: "Icon or element at the end." },
        { name: "trailingSupportingText", type: "ReactNode", description: "Supporting text at the end." },
        { name: "active", type: "boolean", description: "Whether item is in active state." },
        { name: "disabled", type: "boolean", description: "Whether item is disabled." },
        { name: "onClick", type: "() => void", description: "Click handler." },
        { name: "href", type: "string", description: "Link URL for navigation items." },
        { name: "asChild", type: "boolean", description: "Render as child element (e.g., Link)." },
      ],
    },
    {
      name: "ListSubheader",
      description: "Section header for grouping list items.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Header text." },
      ],
    },
    {
      name: "ListItemContent",
      description: "Flexible content container with leading, center, and trailing slots.",
      props: [
        { name: "leading", type: "ReactNode", description: "Leading content." },
        { name: "children", type: "ReactNode", required: true, description: "Main content." },
        { name: "trailing", type: "ReactNode", description: "Trailing content." },
      ],
    },
    {
      name: "ListItemText",
      description: "Text wrapper with primary and secondary text.",
      props: [
        { name: "primary", type: "ReactNode", required: true, description: "Primary text." },
        { name: "secondary", type: "ReactNode", description: "Secondary text." },
      ],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "List has role='list' for proper screen reader navigation.",
      "Interactive items have role='button' or render as links.",
      "Active state communicated through aria-current.",
    ],
    keyboard: [
      { key: "Tab", description: "Moves focus to next interactive item" },
      { key: "Enter / Space", description: "Activates the focused item" },
    ],
    focus: [
      "Interactive items have visible focus ring.",
      "Focus follows tab order through list items.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Compose lists with ListItem and optional subheaders.",
    code: `import { List, ListItem, ListSubheader, Avatar } from "@unisane/ui";

function ContactList({ contacts }) {
  return (
    <List>
      <ListSubheader>Contacts</ListSubheader>
      {contacts.map((contact) => (
        <ListItem
          key={contact.id}
          headline={contact.name}
          supportingText={contact.email}
          leadingIcon={
            <Avatar
              src={contact.avatar}
              fallback={contact.initials}
              size="sm"
            />
          }
          trailingSupportingText={contact.lastSeen}
          onClick={() => selectContact(contact)}
        />
      ))}
    </List>
  );
}

function NavigationList({ items, activeItem }) {
  return (
    <List>
      {items.map((item) => (
        <ListItem
          key={item.id}
          headline={item.label}
          leadingIcon={<Icon symbol={item.icon} />}
          active={item.id === activeItem}
          href={item.href}
        />
      ))}
    </List>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "navigation-drawer",
      reason: "Use for app-wide navigation in a drawer.",
    },
    {
      slug: "dropdown-menu",
      reason: "Use for action menus in popovers.",
    },
    {
      slug: "table",
      reason: "Use for tabular data with columns.",
    },
  ],
};
