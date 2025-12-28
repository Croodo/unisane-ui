"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Card, Button } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const CardHeroVisual = () => (
  <HeroBackground tone="tertiary">
    {/* Hero Card Example */}
    <div className="transform transition-transform hover:scale-[1.02] duration-500 ease-out">
      <Card variant="elevated" padding="none" className="w-[320px] overflow-hidden shadow-xl">
        <div className="h-44 bg-surface-container-high relative">
          <img
            src="https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
            alt="Abstract art"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6">
          <h3 className="text-headline-small text-on-surface mb-2">Glassmorphism</h3>
          <p className="text-body-medium text-on-surface-variant mb-5 leading-relaxed">
            A visual style that uses transparency and background blur to create a glass-like effect.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outlined" size="sm">
              Explore
            </Button>
            <Button variant="filled" size="sm">
              Learn
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </HeroBackground>
);

export const cardDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "card",
  name: "Cards",
  description:
    "Cards contain content and actions about a single subject. They are flexible containers that can hold images, text, and buttons.",
  category: "containment",
  status: "stable",
  icon: "dashboard",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Card"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <CardHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Three types of cards are available: elevated, filled, and outlined. Choose the type that best fits the hierarchy of your content.",
    columns: {
      emphasis: "Card type",
      rationale: "Usage",
      examples: "Rationale",
    },
    rows: [
      {
        emphasis: "Elevated",
        component: (
          <Card variant="elevated" className="w-24 h-16 pointer-events-none" />
        ),
        rationale: "Create hierarchy between content and the background.",
        examples:
          "Elevated cards have a drop shadow, providing more separation from the background than filled cards, but less than outlined cards.",
      },
      {
        emphasis: "Filled",
        component: (
          <Card variant="filled" className="w-24 h-16 pointer-events-none" />
        ),
        rationale: "Provide a subtle visual separation.",
        examples:
          "Filled cards have a fill color but no shadow or outline. They are good for separating content without drawing too much attention.",
      },
      {
        emphasis: "Outlined",
        component: (
          <Card variant="outlined" className="w-24 h-16 pointer-events-none" />
        ),
        rationale: "Group content with a visual border.",
        examples:
          "Outlined cards have a stroke and no fill or shadow. They are the most subtle card type and work well on white backgrounds.",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Use different card types to create visual hierarchy and separation.",
    items: [
      {
        component: (
          <Card variant="elevated" className="w-full max-w-[200px] p-4 min-h-[140px] flex flex-col">
            <div className="h-3 w-10 bg-outline-variant/30 rounded mb-3" />
            <div className="h-3 w-3/4 bg-outline-variant/30 rounded mb-2" />
            <div className="h-3 w-1/2 bg-outline-variant/30 rounded" />
          </Card>
        ),
        title: "Elevated",
        subtitle: "Lower elevation. Good for list items or dashboard widgets.",
      },
      {
        component: (
          <Card variant="filled" className="w-full max-w-[200px] p-4 min-h-[140px] flex flex-col">
            <div className="h-3 w-10 bg-on-surface/10 rounded mb-3" />
            <div className="h-3 w-3/4 bg-on-surface/10 rounded mb-2" />
            <div className="h-3 w-1/2 bg-on-surface/10 rounded" />
          </Card>
        ),
        title: "Filled",
        subtitle: "Subtle background color. Provides good separation from white backgrounds.",
      },
      {
        component: (
          <Card variant="outlined" className="w-full max-w-[200px] p-4 min-h-[140px] flex flex-col">
            <div className="h-3 w-10 bg-outline-variant/30 rounded mb-3" />
            <div className="h-3 w-3/4 bg-outline-variant/30 rounded mb-2" />
            <div className="h-3 w-1/2 bg-outline-variant/30 rounded" />
          </Card>
        ),
        title: "Outlined",
        subtitle: "Has a border stroke. Good for high information density.",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "variant",
      type: '"elevated" | "filled" | "outlined" | "low" | "high"',
      default: '"elevated"',
      description: "The visual style of the card.",
    },
    {
      name: "padding",
      type: '"none" | "sm" | "md" | "lg"',
      default: '"md"',
      description: "The internal padding of the card.",
    },
    {
      name: "interactive",
      type: "boolean",
      default: "false",
      description:
        "If true, the card will have hover and active states with a ripple effect.",
    },
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "The content to display inside the card.",
    },
    {
      name: "onClick",
      type: "() => void",
      description: "Click handler for interactive cards.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes to apply to the card container.",
    },
  ],

  // ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────
  subComponents: [
    {
      name: "CardHeader",
      description: "Header section for title, subtitle, and action button.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          required: true,
          description: "Header content.",
        },
        {
          name: "className",
          type: "string",
          default: "''",
          description: "Additional styles.",
        },
      ],
    },
    {
      name: "CardTitle",
      description: "Title text styled with titleMedium typography.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          required: true,
          description: "Title text.",
        },
        {
          name: "className",
          type: "string",
          default: "''",
          description: "Additional styles.",
        },
      ],
    },
    {
      name: "CardContent",
      description: "Main content area of the card.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          required: true,
          description: "Content to display.",
        },
        {
          name: "className",
          type: "string",
          default: "''",
          description: "Additional styles.",
        },
      ],
    },
    {
      name: "CardMedia",
      description: "Image or media content with proper aspect ratio.",
      props: [
        {
          name: "src",
          type: "string",
          required: true,
          description: "Image source URL.",
        },
        {
          name: "alt",
          type: "string",
          required: true,
          description: "Alt text for accessibility.",
        },
        {
          name: "aspectRatio",
          type: '"16/9" | "4/3" | "1/1" | "3/4"',
          default: '"16/9"',
          description: "Aspect ratio of the media.",
        },
        {
          name: "className",
          type: "string",
          default: "''",
          description: "Additional styles.",
        },
      ],
    },
    {
      name: "CardFooter",
      description: "Footer section for actions and supplementary info.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          required: true,
          description: "Footer content, typically buttons.",
        },
        {
          name: "className",
          type: "string",
          default: "''",
          description: "Additional styles.",
        },
      ],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Cards are generic containers. If a card is interactive (clickable), ensure it follows the following guidelines:",
      "If the entire card is clickable, use a semantic button or link tag, or add role=\"button\" and proper tab index.",
      "Avoid \"card within a card\" accessibility issues where multiple actions exist in a clickable card. It is better to place actions in the card footer.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Cards are versatile containers.",
    code: `import { Card, Button } from "@unisane/ui";

function ArticleCard() {
  return (
    <Card variant="elevated" padding="none" className="max-w-sm overflow-hidden">
      <Card.Media src="/image.jpg" alt="Description" />
      <div className="p-6">
        <Card.Title>Title</Card.Title>
        <Card.Content>
          <p className="text-body-medium text-on-surface-variant">
            Description text...
          </p>
        </Card.Content>
        <Card.Footer>
          <Button variant="text">Read more</Button>
        </Card.Footer>
      </div>
    </Card>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "list",
      reason: "Use for simpler, repeated items without rich content.",
    },
    {
      slug: "dialog",
      reason: "Use for modal content that requires user attention.",
    },
    {
      slug: "accordion",
      reason: "Use when content should be expandable/collapsible.",
    },
  ],
};
