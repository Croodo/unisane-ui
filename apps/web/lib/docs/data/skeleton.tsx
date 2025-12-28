"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, Card } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const SkeletonHeroVisual = () => (
  <HeroBackground tone="surface">
    {/* Mock Loading Card */}
    <div className="relative bg-surface w-80 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30">
      <div className="px-5 py-4 border-b border-outline-variant/20">
        <Skeleton variant="text" width="50%" height="5u" />
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <SkeletonAvatar size="10u" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" height="4u" />
            <Skeleton variant="text" width="40%" height="3u" />
          </div>
        </div>
        <Skeleton variant="rectangular" width="100%" height="32u" />
        <SkeletonText lines={2} />
      </div>
    </div>
  </HeroBackground>
);

export const skeletonDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "skeleton",
  name: "Skeleton",
  description:
    "Skeleton loaders provide a placeholder preview of content before it loads.",
  category: "communication",
  status: "stable",
  icon: "rectangle",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Skeleton", "SkeletonText", "SkeletonAvatar", "SkeletonCard"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <SkeletonHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Skeletons come in different variants to match the content they're replacing.",
    columns: {
      emphasis: "Variant",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Text",
        component: (
          <Skeleton variant="text" width={120} height="4u" />
        ),
        rationale:
          "Placeholder for text content like titles or paragraphs.",
        examples: "Headlines, Labels, Descriptions",
      },
      {
        emphasis: "Circular",
        component: (
          <Skeleton variant="circular" width="10u" height="10u" />
        ),
        rationale:
          "Placeholder for circular elements like avatars.",
        examples: "Avatars, Profile pictures, Icons",
      },
      {
        emphasis: "Rectangular",
        component: (
          <Skeleton variant="rectangular" width={120} height="16u" />
        ),
        rationale:
          "Placeholder for images, cards, or media content.",
        examples: "Images, Thumbnails, Cards",
      },
      {
        emphasis: "Rounded",
        component: (
          <Skeleton variant="rounded" width={120} height="10u" />
        ),
        rationale:
          "Placeholder for buttons or rounded containers.",
        examples: "Buttons, Tags, Chips",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Use composition helpers for common skeleton patterns.",
    items: [
      {
        component: <SkeletonAvatar size="10u" />,
        title: "Avatar",
        subtitle: "Circular placeholder",
      },
      {
        component: <SkeletonText lines={2} width={100} />,
        title: "Text Block",
        subtitle: "Multiple lines",
      },
      {
        component: <Skeleton variant="rectangular" width={100} height="16u" />,
        title: "Image",
        subtitle: "Media placeholder",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Skeletons are used as placeholders while content is loading.",
    examples: [
      {
        title: "List loading",
        visual: (
          <Card variant="outlined" padding="none" className="max-w-72 mx-auto overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/20 last:border-0">
                <SkeletonAvatar size="10u" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="70%" height="4u" />
                  <Skeleton variant="text" width="50%" height="3u" />
                </div>
              </div>
            ))}
          </Card>
        ),
        caption: "Skeleton placeholders for a loading list",
      },
      {
        title: "Card loading",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-72 mx-auto">
            <SkeletonCard />
          </Card>
        ),
        caption: "Pre-built skeleton card composition",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "variant",
      type: '"text" | "circular" | "rectangular" | "rounded"',
      default: '"rectangular"',
      description: "The shape of the skeleton element.",
    },
    {
      name: "width",
      type: "number | string",
      description: "Width of the skeleton (number for px, string for any unit).",
    },
    {
      name: "height",
      type: "number | string",
      description: "Height of the skeleton.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes to apply.",
    },
  ],

  // ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────
  subComponents: [
    {
      name: "SkeletonText",
      description: "Multiple text lines with the last line shorter.",
      props: [
        { name: "lines", type: "number", default: "3", description: "Number of text lines to display." },
        { name: "width", type: "number | string", default: '"100%"', description: "Width of text lines." },
      ],
    },
    {
      name: "SkeletonAvatar",
      description: "Circular skeleton for avatar placeholders.",
      props: [
        { name: "size", type: "number | string", default: '"10u"', description: "Size of the avatar skeleton." },
      ],
    },
    {
      name: "SkeletonCard",
      description: "Pre-composed card skeleton with avatar, image, and text.",
      props: [
        { name: "className", type: "string", description: "Additional CSS classes." },
      ],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Skeletons use aria-hidden='true' to hide from screen readers.",
      "Use aria-busy='true' on the container while loading.",
      "Provide proper loading announcements for screen readers.",
    ],
    keyboard: [
      { key: "N/A", description: "Skeletons are not interactive" },
    ],
    focus: [
      "Skeletons do not receive focus.",
      "Focus should be managed when content loads.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use skeletons while data is loading.",
    code: `import { Skeleton, SkeletonText, SkeletonAvatar } from "@unisane/ui";

function UserList({ users, isLoading }) {
  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading users">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <SkeletonAvatar size="40px" />
            <div className="flex-1">
              <Skeleton variant="text" width="60%" height={16} />
              <Skeleton variant="text" width="40%" height={12} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {users.map((user) => (
        <div key={user.id} className="flex items-center gap-3 p-4">
          <Avatar src={user.avatar} fallback={user.initials} />
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ))}
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "progress",
      reason: "Use for determinate loading progress.",
    },
    {
      slug: "avatar",
      reason: "Replace with SkeletonAvatar while loading.",
    },
    {
      slug: "card",
      reason: "Use SkeletonCard for loading card states.",
    },
  ],
};
